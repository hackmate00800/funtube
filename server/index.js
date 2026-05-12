const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

const app = express();
const server = http.createServer(app);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const io = new Server(server, {
  cors: {
    origin: clientUrl,
    credentials: true,
  },
});

app.set('io', io);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
});

app.use('/api', apiLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/videos/:videoId/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/summaries', require('./routes/summaries'));
app.use('/api/productivity', require('./routes/productivity'));
app.use('/api/ai-productivity', require('./routes/aiProductivity'));
app.use('/api/notes', require('./routes/note'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/semantic-search', require('./routes/semanticSearch'));
app.use('/api/learning-dna', require('./routes/learningDna'));
app.use('/api/creator-ai', require('./routes/creatorAi'));
app.use('/api/interactive-video', require('./routes/interactiveVideo'));
app.use('/api/learning-paths', require('./routes/learningPath'));
app.use('/api/rooms', require('./routes/communityRoom'));
app.use('/api/code-playground', require('./routes/codePlayground'));
app.use('/api/dubbing', require('./routes/dubbing'));
app.use('/api/project-builder', require('./routes/projectBuilder'));
app.use('/api/shorts', require('./routes/shorts'));
app.use('/api/project-review', require('./routes/projectReview'));

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);

  socket.on('join-video', (videoId) => {
    socket.join(`video:${videoId}`);
  });

  socket.on('leave-video', (videoId) => {
    socket.leave(`video:${videoId}`);
  });

  socket.on('join-notifications', (userId) => {
    socket.join(`user:${userId}`);
  });

  socket.on('new-comment', (data) => {
    socket.to(`video:${data.videoId}`).emit('comment-added', data);
    socket.to(`user:${data.videoOwnerId}`).emit('notification', {
      type: 'new_comment',
      message: `${data.username} commented on your video`,
    });
  });

  socket.on('new-subscriber', (data) => {
    socket.to(`user:${data.channelOwnerId}`).emit('notification', {
      type: 'new_subscriber',
      message: `${data.username} subscribed to you`,
    });
  });

  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
  });
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION', { error: reason });
});

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    logger.info(`FunTube Server running on port ${PORT}`);
  });
});
