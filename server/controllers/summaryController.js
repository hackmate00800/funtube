const path = require('path');
const fs = require('fs');
const Summary = require('../models/Summary');
const Video = require('../models/Video');
const ErrorResponse = require('../utils/errorResponse');
const { extractAudio, transcribeWithGemini, extractTimestampedSegments } = require('../utils/transcriptProcessor');
const { generateFullSummaryForLevel } = require('../utils/summaryGenerator');
const { generateSummaryPDF } = require('../utils/pdfGenerator');
const queue = require('../utils/queue');
const logger = require('../utils/logger');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

exports.getSummary = async (req, res, next) => {
  try {
    const summary = await Summary.findOne({ video: req.params.videoId });
    if (!summary) {
      return res.status(200).json({ success: true, data: null });
    }
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

exports.generateSummary = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    const existing = await Summary.findOne({ video: video._id });
    if (existing && existing.summaryStatus === 'completed') {
      return res.status(200).json({ success: true, data: existing, cached: true });
    }

    if (existing && (existing.summaryStatus === 'processing' || existing.transcriptStatus === 'processing')) {
      return res.status(200).json({ success: true, data: existing, status: 'processing' });
    }

    const summary = existing || await Summary.create({
      video: video._id,
      user: req.user._id,
      duration: video.duration || 0,
    });

    res.status(202).json({ success: true, data: summary, status: 'queued' });

    queue.add(`summary-${video._id}`, async (onProgress) => {
      try {
        onProgress({ stage: 'transcribing', progress: 10 });

        const videoFilePath = video.url
          ? path.join(UPLOADS_DIR, video.url.replace('/uploads/', ''))
          : null;

        let transcript = '';
        if (videoFilePath && fs.existsSync(videoFilePath) && (video.duration || 0) <= 600) {
          const audioDir = path.join(UPLOADS_DIR, 'audio');
          if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
          const audioPath = path.join(audioDir, `audio_${video._id}.mp3`);
          if (!fs.existsSync(audioPath)) {
            await extractAudio(videoFilePath, audioPath);
          }
          onProgress({ stage: 'transcribing', progress: 30 });

          transcript = await transcribeWithGemini(audioPath);
        } else {
          transcript = `Mock transcript for "${video.title}". Duration: ${video.duration || 0} seconds.`;
        }

        await Summary.updateOne(
          { _id: summary._id },
          { transcript, transcriptStatus: 'completed' }
        );
        onProgress({ stage: 'summarizing', progress: 50 });

        const levels = [];
        const levelNames = req.body.levels || ['beginner', 'intermediate', 'expert'];

        for (let i = 0; i < levelNames.length; i++) {
          const level = levelNames[i];
          const data = await generateFullSummaryForLevel(level, transcript, video.duration || 0);
          levels.push({ level, ...data });
          onProgress({ stage: 'summarizing', progress: 50 + Math.round(((i + 1) / levelNames.length) * 40) });
        }

        await Summary.updateOne(
          { _id: summary._id },
          { levels, summaryStatus: 'completed', cached: true, cachedAt: new Date(), error: null }
        );

        onProgress({ progress: 100 });
      } catch (err) {
        logger.error('Summary generation failed:', err);
        await Summary.updateOne(
          { _id: summary._id },
          { summaryStatus: 'failed', error: err.message }
        );
        throw err;
      }
    });

  } catch (err) {
    next(err);
  }
};

exports.getSummaryStatus = async (req, res, next) => {
  try {
    const summary = await Summary.findOne({ video: req.params.videoId });
    if (!summary) {
      return res.status(200).json({ success: true, status: 'none' });
    }
    res.status(200).json({
      success: true,
      status: summary.summaryStatus,
      transcriptStatus: summary.transcriptStatus,
      error: summary.error,
    });
  } catch (err) {
    next(err);
  }
};

exports.regenerateLevel = async (req, res, next) => {
  try {
    const { level } = req.params;
    if (!['beginner', 'intermediate', 'expert'].includes(level)) {
      return next(new ErrorResponse('Invalid level', 400));
    }

    const summary = await Summary.findOne({ video: req.params.videoId });
    if (!summary || !summary.transcript) {
      return next(new ErrorResponse('No transcript available', 400));
    }

    const data = await generateFullSummaryForLevel(level, summary.transcript, summary.duration || 0);
    const existingLevels = summary.levels.filter((l) => l.level !== level);
    existingLevels.push({ level, ...data });

    summary.levels = existingLevels;
    summary.summaryStatus = 'completed';
    await summary.save();

    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

exports.downloadPDF = async (req, res, next) => {
  try {
    const summary = await Summary.findOne({ video: req.params.videoId }).populate('video', 'title');
    if (!summary || summary.summaryStatus !== 'completed') {
      return next(new ErrorResponse('Summary not ready', 400));
    }

    const videoTitle = summary.video?.title || 'Untitled';
    const pdfBuffer = await generateSummaryPDF(
      { levels: summary.levels },
      req.user?.username || 'User',
      videoTitle
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="summary-${req.params.videoId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
