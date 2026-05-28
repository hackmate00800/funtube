const { google } = require('googleapis');
const https = require('https');
const { URL } = require('url');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function getOAuth2Client(redirectUri) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

function getAuthUrl(redirectUri) {
  const oauth2Client = getOAuth2Client(redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

async function getTokensFromCode(code, redirectUri) {
  const oauth2Client = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

function getDriveClient(refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

async function getAccessToken(refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { token } = await oauth2Client.getAccessToken();
  return token;
}

async function getFileMetadata(driveClient, fileId) {
  const res = await driveClient.files.get({
    fileId,
    fields: 'id, name, mimeType, size, webContentLink, thumbnailLink',
  });
  return res.data;
}

async function streamFile(driveClient, fileId, range) {
  const args = { fileId, alt: 'media' };
  if (range) args.headers = { Range: range };
  const res = await driveClient.files.get(args, { responseType: 'stream' });
  return res;
}

async function initResumableUpload(refreshToken, fileName, fileSize, mimeType) {
  const token = await getAccessToken(refreshToken);
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

  return new Promise((resolve, reject) => {
    const metadata = JSON.stringify({
      name: fileName,
      ...(folderId ? { parents: [folderId] } : {}),
    });

    const req = https.request({
      method: 'POST',
      hostname: 'www.googleapis.com',
      path: '/upload/drive/v3/files?uploadType=resumable',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType || 'video/mp4',
        'X-Upload-Content-Length': fileSize,
        'Content-Length': Buffer.byteLength(metadata),
      },
    }, (res) => {
      const location = res.headers.location;
      if (!location) {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => reject(new Error(body || 'No upload URL returned')));
        return;
      }
      resolve(location);
    });

    req.on('error', reject);
    req.write(metadata);
    req.end();
  });
}

async function finalizeUpload(uploadUrl) {
  const parsed = new URL(uploadUrl);

  return new Promise((resolve, reject) => {
    const req = https.request({
      method: 'PUT',
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'Content-Length': 0,
        'Content-Range': 'bytes */0',
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error('Invalid response')); }
        } else if (res.statusCode === 308) {
          const range = res.headers.range;
          resolve({ incomplete: true, range: range || '' });
        } else {
          reject(new Error(body || `Upload failed: ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function deleteFile(driveClient, fileId) {
  await driveClient.files.delete({ fileId });
}

async function getUserEmail(driveClient) {
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: driveClient._options?.auth || driveClient.context?.auth });
    const { data } = await oauth2.userinfo.get();
    return data.email || '';
  } catch {
    return '';
  }
}

module.exports = {
  getAuthUrl,
  getTokensFromCode,
  getDriveClient,
  getFileMetadata,
  streamFile,
  initResumableUpload,
  finalizeUpload,
  deleteFile,
  getUserEmail,
};
