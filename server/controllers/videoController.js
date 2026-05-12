const Video = require('../models/Video');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const ErrorResponse = require('../utils/errorResponse');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

exports.uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please upload a video file', 400));
    }

    const video = await Video.create({
      user: req.user.id,
      title: req.body.title || 'Untitled Video',
      description: req.body.description || '',
      url: `/uploads/videos/${req.file.filename}`,
      thumbnail: '/uploads/thumbnails/default-thumbnail.png',
      category: req.body.category || 'Other',
      tags: req.body.tags ? req.body.tags.split(',').map((t) => t.trim()) : [],
      isPublic: req.body.isPublic !== 'false',
      fileSize: req.file.size,
      format: path.extname(req.file.originalname).substring(1),
      status: 'uploading',
    });

    const videoPath = req.file.path;
    const thumbnailPath = path.join(
      __dirname,
      '../../uploads/thumbnails',
      `thumb_${video._id}.png`
    );

    let duration = 0;
    let resolution = '360p';

    try {
      const metadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      duration = Math.floor(metadata.format.duration);
      resolution = getResolution(metadata.streams[0].height);
      video.duration = duration;
      video.resolution = resolution;
      video.status = 'processing';
      await video.save();

      const resolutions = [144, 240, 360, 480, 720, 1080, 1440];

      const outputDir = path.join(
        __dirname,
        '../../uploads/videos',
        String(video._id)
      );
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      try {
        for (const res of resolutions) {
          if (res <= metadata.streams[0].height) {
            await new Promise((resolve, reject) => {
              ffmpeg(videoPath)
                .size(`?x${res}`)
                .output(path.join(outputDir, `${res}p.mp4`))
                .on('end', resolve)
                .on('error', reject)
                .run();
            });
          }
        }
      } catch (err) {
        console.error('Transcoding failed:', err);
      }

      try {
        await new Promise((resolve, reject) => {
          ffmpeg(videoPath)
            .screenshots({
              count: 1,
              folder: path.join(__dirname, '../../uploads/thumbnails'),
              filename: `thumb_${video._id}.png`,
              size: '320x180',
            })
            .on('end', resolve)
            .on('error', reject);
        });
        video.thumbnail = `/uploads/thumbnails/thumb_${video._id}.png`;
      } catch (err) {
        console.error('Thumbnail generation failed:', err);
      }

      const validResolutions = resolutions
        .filter((r) => r <= metadata.streams[0].height)
        .map((r) => `${r}p`);
      video.videoResolutions = validResolutions;
      video.isProcessed = true;
      video.processingProgress = 100;
      video.status = 'ready';
      await video.save();
    } catch (err) {
      video.status = 'failed';
      await video.save();
    }

    await Analytics.create({
      video: video._id,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: video,
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadThumbnail = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please upload a thumbnail', 400));
    }

    const thumbnailPath = `/uploads/thumbnails/${req.file.filename}`;
    const video = await Video.findByIdAndUpdate(
      req.params.videoId,
      { thumbnail: thumbnailPath, thumbnailGenerated: false },
      { new: true }
    );

    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    res.status(200).json({
      success: true,
      data: { thumbnail: thumbnailPath },
    });
  } catch (err) {
    next(err);
  }
};

exports.getVideos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { isPublic: true, status: 'ready' };

    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    if (req.query.user) {
      query.user = req.query.user;
    }

    let sort = {};
    if (req.query.sort === 'trending') sort = { views: -1, likes: -1 };
    else if (req.query.sort === 'oldest') sort = { createdAt: 1 };
    else sort = { createdAt: -1 };

    const videos = await Video.find(query)
      .populate('user', 'username avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Video.countDocuments(query);

    res.status(200).json({
      success: true,
      count: videos.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: videos,
    });
  } catch (err) {
    next(err);
  }
};

exports.getVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('user', 'username avatar subscribers channelDescription')
      .populate('likes');

    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          watchHistory: {
            $each: [{ video: video._id, watchedAt: Date.now() }],
            $position: 0,
            $slice: 200,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      data: video,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    if (video.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized', 403));
    }

    const { title, description, category, tags, isPublic, allowComments } =
      req.body;

    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (category) video.category = category;
    if (tags) video.tags = tags.split(',').map((t) => t.trim());
    if (isPublic !== undefined) video.isPublic = isPublic;
    if (allowComments !== undefined) video.allowComments = allowComments;

    await video.save();

    res.status(200).json({
      success: true,
      data: video,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    if (video.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized', 403));
    }

    const videoPath = path.join(__dirname, '../../', video.url);
    const thumbnailPath = path.join(__dirname, '../../', video.thumbnail);

    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);

    const dir = path.join(
      __dirname,
      '../../uploads/videos',
      String(video._id)
    );
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }

    await video.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Video deleted',
    });
  } catch (err) {
    next(err);
  }
};

exports.likeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    const user = await User.findById(req.user.id);
    const alreadyLiked = video.likes.includes(req.user.id);
    const alreadyDisliked = video.dislikes.includes(req.user.id);

    if (alreadyLiked) {
      video.likes.pull(req.user.id);
      user.likedVideos.pull(req.params.id);
    } else {
      if (alreadyDisliked) {
        video.dislikes.pull(req.user.id);
        user.dislikedVideos.pull(req.params.id);
      }
      video.likes.push(req.user.id);
      user.likedVideos.push(req.params.id);
    }

    await video.save();
    await user.save();

    res.status(200).json({
      success: true,
      likes: video.likes.length,
      dislikes: video.dislikes.length,
      isLiked: !alreadyLiked,
      isDisliked: false,
    });
  } catch (err) {
    next(err);
  }
};

exports.dislikeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    const user = await User.findById(req.user.id);
    const alreadyDisliked = video.dislikes.includes(req.user.id);
    const alreadyLiked = video.likes.includes(req.user.id);

    if (alreadyDisliked) {
      video.dislikes.pull(req.user.id);
      user.dislikedVideos.pull(req.params.id);
    } else {
      if (alreadyLiked) {
        video.likes.pull(req.user.id);
        user.likedVideos.pull(req.params.id);
      }
      video.dislikes.push(req.user.id);
      user.dislikedVideos.push(req.params.id);
    }

    await video.save();
    await user.save();

    res.status(200).json({
      success: true,
      likes: video.likes.length,
      dislikes: video.dislikes.length,
      isDisliked: !alreadyDisliked,
      isLiked: false,
    });
  } catch (err) {
    next(err);
  }
};

exports.getTrending = async (req, res, next) => {
  try {
    const videos = await Video.find({ isPublic: true, status: 'ready' })
      .populate('user', 'username avatar')
      .sort({ views: -1, likes: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (err) {
    next(err);
  }
};

exports.getRecommended = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    const recommended = await Video.find({
      _id: { $ne: video._id },
      $or: [
        { category: video.category },
        { tags: { $in: video.tags } },
      ],
      isPublic: true,
      status: 'ready',
    })
      .populate('user', 'username avatar')
      .limit(20)
      .sort({ views: -1 });

    res.status(200).json({
      success: true,
      count: recommended.length,
      data: recommended,
    });
  } catch (err) {
    next(err);
  }
};

exports.incrementShare = async (req, res, next) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { shares: 1 } },
      { new: true }
    );

    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    res.status(200).json({
      success: true,
      shares: video.shares,
    });
  } catch (err) {
    next(err);
  }
};

exports.addToWatchLater = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const alreadyInList = user.watchLater.includes(req.params.id);

    if (alreadyInList) {
      user.watchLater.pull(req.params.id);
    } else {
      user.watchLater.push(req.params.id);
    }

    await user.save();

    res.status(200).json({
      success: true,
      isInWatchLater: !alreadyInList,
    });
  } catch (err) {
    next(err);
  }
};

exports.streamVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    const quality = req.params.quality || 'original';

    let filePath;
    if (quality === 'original') {
      filePath = path.join(__dirname, '../..', video.url);
    } else {
      filePath = path.join(
        __dirname,
        '../../uploads/videos',
        String(video._id),
        `${quality}.mp4`
      );
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, '../..', video.url);
    }

    if (!fs.existsSync(filePath)) {
      return next(new ErrorResponse('Video file not found', 404));
    }

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', () => {
      if (!res.headersSent) res.status(500).json({ success: false, error: 'Stream error' });
    });
  } catch (err) {
    next(err);
  }
};

exports.getCreatorVideos = async (req, res, next) => {
  try {
    const videos = await Video.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (err) {
    next(err);
  }
};

function getResolution(height) {
  if (height <= 144) return '144p';
  if (height <= 240) return '240p';
  if (height <= 360) return '360p';
  if (height <= 480) return '480p';
  if (height <= 720) return '720p';
  if (height <= 1080) return '1080p';
  if (height <= 1440) return '1440p';
  return '4K';
}
