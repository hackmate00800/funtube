const Comment = require('../models/Comment');
const Video = require('../models/Video');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');

exports.getComments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ video: req.params.videoId })
      .populate('user', 'username avatar')
      .populate('replies.user', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ video: req.params.videoId });

    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: comments,
    });
  } catch (err) {
    next(err);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    const comment = await Comment.create({
      user: req.user.id,
      video: req.params.videoId,
      text: req.body.text,
    });

    if (video.user.toString() !== req.user.id) {
      await Notification.create({
        user: video.user,
        type: 'new_comment',
        message: `${req.user.username} commented on your video "${video.title}"`,
        link: `/watch/${video._id}`,
        fromUser: req.user.id,
        image: req.user.avatar,
      });
    }

    const populated = await Comment.findById(comment._id)
      .populate('user', 'username avatar');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return next(new ErrorResponse('Comment not found', 404));
    }

    if (
      comment.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted',
    });
  } catch (err) {
    next(err);
  }
};

exports.likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return next(new ErrorResponse('Comment not found', 404));
    }

    const alreadyLiked = comment.likes.includes(req.user.id);
    if (alreadyLiked) {
      comment.likes.pull(req.user.id);
    } else {
      comment.likes.push(req.user.id);
      const alreadyDisliked = comment.dislikes.includes(req.user.id);
      if (alreadyDisliked) {
        comment.dislikes.pull(req.user.id);
      }
    }

    await comment.save();

    res.status(200).json({
      success: true,
      likes: comment.likes.length,
      dislikes: comment.dislikes.length,
      isLiked: !alreadyLiked,
    });
  } catch (err) {
    next(err);
  }
};

exports.addReply = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return next(new ErrorResponse('Comment not found', 404));
    }

    comment.replies.push({
      user: req.user.id,
      text: req.body.text,
    });

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('replies.user', 'username avatar');

    res.status(201).json({
      success: true,
      data: updatedComment.replies,
    });
  } catch (err) {
    next(err);
  }
};
