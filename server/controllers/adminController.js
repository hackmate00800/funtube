const User = require('../models/User');
const DriveVideo = require('../models/DriveVideo');
const InviteLink = require('../models/InviteLink');
const DriveAccount = require('../models/DriveAccount');
const DriveAnalytics = require('../models/DriveAnalytics');
const ErrorResponse = require('../utils/errorResponse');

exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const filter = search
      ? { $or: [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    const userIds = users.map(u => u._id);
    const driveAccounts = await DriveAccount.find({ user: { $in: userIds } });
    const driveAccountMap = {};
    driveAccounts.forEach(da => { driveAccountMap[da.user.toString()] = true; });

    const usersWithDriveStatus = users.map(u => ({
      ...u.toJSON(),
      hasDriveConnected: !!driveAccountMap[u._id.toString()],
    }));

    res.json({
      success: true,
      data: usersWithDriveStatus,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    const driveAccount = await DriveAccount.findOne({ user: user._id });
    const videos = await DriveVideo.find({ uploader: user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        user,
        driveConnected: !!driveAccount && driveAccount.isConnected,
        driveEmail: driveAccount?.googleEmail || '',
        videos,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'creator', 'admin'].includes(role)) {
      return next(new ErrorResponse('Invalid role', 400));
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return next(new ErrorResponse('Cannot delete yourself', 400));
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    await DriveVideo.deleteMany({ uploader: user._id });
    await InviteLink.deleteMany({ uploader: user._id });
    await DriveAccount.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });
    res.json({ success: true, message: 'User and all associated data deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getVideos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const videos = await DriveVideo.find()
      .populate('uploader', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DriveVideo.countDocuments();

    res.json({
      success: true,
      data: videos,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleVideoActive = async (req, res, next) => {
  try {
    const video = await DriveVideo.findById(req.params.id);
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }
    video.isActive = !video.isActive;
    await video.save();
    res.json({ success: true, data: video });
  } catch (err) {
    next(err);
  }
};

exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await DriveVideo.findByIdAndDelete(req.params.id);
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }
    await InviteLink.deleteMany({ video: video._id });
    await DriveAnalytics.deleteMany({ video: video._id });
    res.json({ success: true, message: 'Video and associated invites deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const totalVideos = await DriveVideo.countDocuments();
    const activeInvites = await InviteLink.countDocuments({ isActive: true });
    const totalViews = await DriveVideo.aggregate([
      { $group: { _id: null, total: { $sum: '$viewCount' } } },
    ]);
    const totalViewCount = totalViews.length > 0 ? totalViews[0].total : 0;

    const recentAnalytics = await DriveAnalytics.find()
      .populate('video', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    const videosPerDay = await DriveVideo.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    res.json({
      success: true,
      data: {
        totalVideos,
        activeInvites,
        totalViewCount,
        recentAnalytics,
        videosPerDay,
      },
    });
  } catch (err) {
    next(err);
  }
};
