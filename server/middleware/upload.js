const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const MAGIC_BYTES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  jpg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46],
  gif: [0x47, 0x49, 0x46],
  mp4: [0x00, 0x00, 0x00],
  webm: [0x1A, 0x45, 0xDF, 0xA3],
};

const validateMagicBytes = (filePath, expectedExt) => {
  const ext = path.extname(expectedExt).toLowerCase().replace('.', '') || 'jpg';
  const magic = MAGIC_BYTES[ext];
  if (!magic) return true;
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(magic.length);
  fs.readSync(fd, buffer, 0, magic.length, 0);
  fs.closeSync(fd);
  for (let i = 0; i < magic.length; i++) {
    if (i === 0 && ext === 'mp4') continue;
    if (buffer[i] !== magic[i]) return false;
  }
  return true;
};

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

const validateUploadedFile = (req, res, next) => {
  const files = [];
  if (req.file) files.push(req.file);
  if (req.files) {
    for (const field of Object.values(req.files)) files.push(...field);
  }
  for (const file of files) {
    if (!validateMagicBytes(file.path, file.originalname)) {
      for (const f of files) {
        try { fs.unlinkSync(f.path); } catch {}
      }
      return res.status(400).json({ success: false, error: `Invalid file content: ${file.originalname}` });
    }
  }
  next();
};

exports.uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500000000 },
  fileFilter: videoFilter,
});

exports.validateUpload = validateUploadedFile;

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
