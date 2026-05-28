const ErrorResponse = require('../utils/errorResponse');

exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ErrorResponse('Admin access required', 403));
  }
  next();
};

exports.uploaderOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'uploader' && req.user.role !== 'admin')) {
    return next(new ErrorResponse('Uploader or admin access required', 403));
  }
  next();
};
