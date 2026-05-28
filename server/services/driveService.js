const { google } = require('googleapis');

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

async function getFileMetadata(driveClient, fileId) {
  const res = await driveClient.files.get({
    fileId,
    fields: 'id, name, mimeType, size, webContentLink, thumbnailLink',
  });
  return res.data;
}

async function streamFile(driveClient, fileId, range) {
  const args = { fileId, alt: 'media' };
  if (range) {
    args.headers = { Range: range };
  }
  const res = await driveClient.files.get(args, { responseType: 'stream' });
  return res;
}

async function uploadFile(driveClient, fileBuffer, fileName, mimeType) {
  const res = await driveClient.files.create({
    requestBody: {
      name: fileName,
      parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : [],
    },
    media: {
      mimeType,
      body: require('stream').Readable.from(fileBuffer),
    },
    fields: 'id, name, mimeType, size',
  });
  return res.data;
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
  uploadFile,
  deleteFile,
  getUserEmail,
};
