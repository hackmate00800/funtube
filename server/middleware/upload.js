const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/videos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/thumbnails'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `thumb_${uuidv4()}${ext}`);
  },
});

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${uuidv4()}${ext}`);
  },
});

const videoFilter = (req, file, cb) => {
  const allowedTypes = [
    'video/mp4',
    'video/mkv',
    'video/x-matroska',
    'video/webm',
    'video/avi',
    'video/x-msvideo',
    'video/mov',
    'video/quicktime',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid video format. Supported: mp4, mkv, webm, avi, mov'), false);
  }
};

const imageFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Supported: jpeg, png, webp, gif'), false);
  }
};

exports.uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500000000 },
  fileFilter: videoFilter,
});

exports.uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5000000 },
  fileFilter: imageFilter,
});

exports.uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2000000 },
  fileFilter: imageFilter,
});

const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/covers'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cover_${uuidv4()}${ext}`);
  },
});

exports.uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: 5000000 },
  fileFilter: imageFilter,
});
