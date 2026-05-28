const InviteLink = require('../models/InviteLink');
const DriveVideo = require('../models/DriveVideo');
const DriveAccount = require('../models/DriveAccount');
const DriveAnalytics = require('../models/DriveAnalytics');
const ErrorResponse = require('../utils/errorResponse');
const driveService = require('../services/driveService');

exports.streamByInvite = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invite = await InviteLink.findOne({ token }).populate('video');
    if (!invite) {
      return next(new ErrorResponse('Invalid invite link', 404));
    }

    if (!invite.isActive) {
      return next(new ErrorResponse('This invite link has been disabled', 410));
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return next(new ErrorResponse('This invite link has expired', 410));
    }

    if (invite.maxViews > 0 && invite.viewsCount >= invite.maxViews) {
      return next(new ErrorResponse('This invite link has reached its view limit', 410));
    }

    const video = invite.video;
    if (!video || !video.isActive) {
      return next(new ErrorResponse('Video not available', 404));
    }

    const account = await DriveAccount.findOne({ user: video.uploader, isConnected: true });
    if (!account) {
      return next(new ErrorResponse('Content source unavailable', 503));
    }

    invite.viewsCount += 1;
    await invite.save();

    video.viewCount += 1;
    await video.save();

    const driveClient = driveService.getDriveClient(account.refreshToken);

    try {
      await driveService.getFileMetadata(driveClient, video.driveFileId);
    } catch {
      return next(new ErrorResponse('Video file not found on Google Drive', 404));
    }

    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : undefined;

      const driveRes = await driveService.streamFile(driveClient, video.driveFileId, range);

      const contentLength = parseInt(driveRes.headers['content-length'] || '0');
      const totalSize = end ? (end - start + 1) : contentLength;
      const fullSize = parseInt(driveRes.headers['content-range']?.split('/')[1] || contentLength.toString());

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end || fullSize - 1}/${fullSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': totalSize,
        'Content-Type': video.mimeType || 'video/mp4',
        'Cache-Control': 'private, max-age=3600',
      });

      driveRes.data.pipe(res);

      driveRes.data.on('data', (chunk) => {
        const analytics = new DriveAnalytics({
          video: video._id,
          inviteLink: invite._id,
          viewerIP: req.ip || '',
          userAgent: req.headers['user-agent'] || '',
          bytesStreamed: chunk.length,
        });
        analytics.save().catch(() => {});
      });

      driveRes.data.on('error', () => {
        if (!res.headersSent) res.end();
      });
    } else {
      const driveRes = await driveService.streamFile(driveClient, video.driveFileId);
      const totalSize = parseInt(driveRes.headers['content-length'] || '0');

      res.writeHead(200, {
        'Content-Type': video.mimeType || 'video/mp4',
        'Content-Length': totalSize,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=3600',
      });

      driveRes.data.pipe(res);

      driveRes.data.on('error', () => {
        if (!res.headersSent) res.end();
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getVideoInfo = async (req, res, next) => {
  try {
    const invite = await InviteLink.findOne({ token: req.params.token })
      .populate('video', 'title description thumbnail duration category seriesName episodeNumber viewCount');

    if (!invite) {
      return next(new ErrorResponse('Invalid invite link', 404));
    }

    if (!invite.isActive) {
      return next(new ErrorResponse('This invite link has been disabled', 410));
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return next(new ErrorResponse('This invite link has expired', 410));
    }

    res.json({ success: true, data: invite.video });
  } catch (err) {
    next(err);
  }
};
