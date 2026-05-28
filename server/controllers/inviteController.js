const InviteLink = require('../models/InviteLink');
const DriveVideo = require('../models/DriveVideo');
const ErrorResponse = require('../utils/errorResponse');
const crypto = require('crypto');

exports.createInviteLink = async (req, res, next) => {
  try {
    const { videoId, maxViews, expiresInHours } = req.body;
    if (!videoId) {
      return next(new ErrorResponse('Video ID is required', 400));
    }

    const video = await DriveVideo.findOne({ _id: videoId, uploader: req.user.id });
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    const invite = await InviteLink.create({
      video: videoId,
      uploader: req.user.id,
      maxViews: parseInt(maxViews) || 0,
      expiresAt: expiresInHours ? new Date(Date.now() + parseInt(expiresInHours) * 60 * 60 * 1000) : null,
    });

    res.status(201).json({ success: true, data: invite });
  } catch (err) {
    next(err);
  }
};

exports.getInviteLinks = async (req, res, next) => {
  try {
    const filter = { uploader: req.user.id };
    if (req.query.videoId) {
      filter.video = req.query.videoId;
    }

    const invites = await InviteLink.find(filter)
      .populate('video', 'title thumbnail')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: invites });
  } catch (err) {
    next(err);
  }
};

exports.updateInviteLink = async (req, res, next) => {
  try {
    const { isActive, maxViews, expiresInHours } = req.body;
    const update = {};
    if (isActive !== undefined) update.isActive = isActive;
    if (maxViews !== undefined) update.maxViews = parseInt(maxViews);
    if (expiresInHours !== undefined) {
      update.expiresAt = new Date(Date.now() + parseInt(expiresInHours) * 60 * 60 * 1000);
    }

    const invite = await InviteLink.findOneAndUpdate(
      { _id: req.params.id, uploader: req.user.id },
      { $set: update },
      { new: true }
    );
    if (!invite) {
      return next(new ErrorResponse('Invite link not found', 404));
    }
    res.json({ success: true, data: invite });
  } catch (err) {
    next(err);
  }
};

exports.deleteInviteLink = async (req, res, next) => {
  try {
    const invite = await InviteLink.findOneAndDelete({ _id: req.params.id, uploader: req.user.id });
    if (!invite) {
      return next(new ErrorResponse('Invite link not found', 404));
    }
    res.json({ success: true, message: 'Invite link deleted' });
  } catch (err) {
    next(err);
  }
};
