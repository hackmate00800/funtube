const DriveAccount = require('../models/DriveAccount');
const DriveVideo = require('../models/DriveVideo');
const ErrorResponse = require('../utils/errorResponse');
const driveService = require('../services/driveService');

function getCallbackUrl(req) {
  return process.env.GOOGLE_DRIVE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/drive/callback`;
}

exports.getAuthUrl = async (req, res, next) => {
  try {
    const url = driveService.getAuthUrl(getCallbackUrl(req));
    res.json({ success: true, url });
  } catch (err) {
    next(err);
  }
};

exports.handleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(`${clientUrl}/uploader?drive=error&message=no_code`);
    }

    const tokens = await driveService.getTokensFromCode(code, getCallbackUrl(req));
    if (!tokens.refresh_token) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(`${clientUrl}/uploader?drive=error&message=no_refresh_token`);
    }

    const driveClient = driveService.getDriveClient(tokens.refresh_token);
    let googleEmail = '';
    try {
      googleEmail = await driveService.getUserEmail(driveClient);
    } catch {}

    const filter = { user: req.user.id };
    const update = {
      user: req.user.id,
      accessToken: tokens.access_token || '',
      refreshToken: tokens.refresh_token,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      googleEmail,
      isConnected: true,
    };

    await DriveAccount.findOneAndUpdate(filter, update, { upsert: true, new: true });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/uploader?drive=connected`);
  } catch (err) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/uploader?drive=error&message=connection_failed`);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const account = await DriveAccount.findOne({ user: req.user.id });
    res.json({
      success: true,
      connected: !!account && account.isConnected,
      email: account?.googleEmail || '',
    });
  } catch (err) {
    next(err);
  }
};

exports.disconnect = async (req, res, next) => {
  try {
    await DriveAccount.findOneAndUpdate(
      { user: req.user.id },
      { isConnected: false, accessToken: '', refreshToken: '', googleEmail: '' }
    );
    res.json({ success: true, message: 'Google Drive disconnected' });
  } catch (err) {
    next(err);
  }
};

exports.uploadVideo = async (req, res, next) => {
  try {
    const account = await DriveAccount.findOne({ user: req.user.id, isConnected: true });
    if (!account) {
      return next(new ErrorResponse('Please connect your Google Drive first', 400));
    }

    const { title, description, category, seriesName, episodeNumber, access } = req.body;
    if (!title) {
      return next(new ErrorResponse('Title is required', 400));
    }

    const file = req.file;
    if (!file) {
      return next(new ErrorResponse('Video file is required', 400));
    }

    const driveClient = driveService.getDriveClient(account.refreshToken);
    const driveFile = await driveService.uploadFile(driveClient, file.buffer, file.originalname, file.mimetype);

    const video = await DriveVideo.create({
      uploader: req.user.id,
      title,
      description: description || '',
      driveFileId: driveFile.id,
      mimeType: driveFile.mimeType || file.mimetype,
      fileSize: driveFile.size ? parseInt(driveFile.size) : file.size,
      category: category || 'other',
      seriesName: seriesName || '',
      episodeNumber: episodeNumber ? parseInt(episodeNumber) : 0,
      access: access || 'unlisted',
    });

    res.status(201).json({ success: true, data: video });
  } catch (err) {
    next(err);
  }
};

exports.getMyVideos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const videos = await DriveVideo.find({ uploader: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DriveVideo.countDocuments({ uploader: req.user.id });

    res.json({
      success: true,
      data: videos,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getVideo = async (req, res, next) => {
  try {
    const video = await DriveVideo.findOne({ _id: req.params.id, uploader: req.user.id });
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }
    res.json({ success: true, data: video });
  } catch (err) {
    next(err);
  }
};

exports.updateVideo = async (req, res, next) => {
  try {
    const { title, description, category, seriesName, episodeNumber, access, thumbnail } = req.body;
    const video = await DriveVideo.findOneAndUpdate(
      { _id: req.params.id, uploader: req.user.id },
      { $set: { title, description, category, seriesName, episodeNumber, access, thumbnail } },
      { new: true, runValidators: true }
    );
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }
    res.json({ success: true, data: video });
  } catch (err) {
    next(err);
  }
};

exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await DriveVideo.findOne({ _id: req.params.id, uploader: req.user.id });
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    const account = await DriveAccount.findOne({ user: req.user.id });
    if (account && account.isConnected) {
      try {
        const driveClient = driveService.getDriveClient(account.refreshToken);
        await driveService.deleteFile(driveClient, video.driveFileId);
      } catch {}
    }

    await DriveVideo.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Video deleted' });
  } catch (err) {
    next(err);
  }
};
