const Analytics = require('../models/Analytics');
const Video = require('../models/Video');
const ErrorResponse = require('../utils/errorResponse');

exports.getVideoAnalytics = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    if (video.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized', 403));
    }

    let analytics = await Analytics.findOne({ video: req.params.videoId });

    if (!analytics) {
      analytics = await Analytics.create({
        video: req.params.videoId,
        user: req.user._id,
      });
    }

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCreatorSummary = async (req, res, next) => {
  try {
    const totalVideos = await Video.countDocuments({ user: req.user._id });
    const totalViews = await Video.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } },
    ]);
    const totalLikes = await Video.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: { $size: '$likes' } },
        },
      },
    ]);

    const recentVideos = await Video.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title views likes createdAt');

    res.status(200).json({
      success: true,
      data: {
        totalVideos,
        totalViews: totalViews[0]?.totalViews || 0,
        totalLikes: totalLikes[0]?.totalLikes || 0,
        recentVideos,
      },
    });
  } catch (err) {
    next(err);
  }
};
