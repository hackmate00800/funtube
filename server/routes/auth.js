const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  updatePreferences,
  getChannel,
  subscribe,
  createChannel,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validate');
const { uploadAvatar, uploadCover } = require('../middleware/upload');

const authLimiter = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
});

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.put('/preferences', protect, updatePreferences);
router.get('/channel/:id', getChannel);
router.put('/subscribe/:id', protect, subscribe);
router.put('/create-channel', protect, uploadAvatar.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]), createChannel);

router.get('/csrf', (req, res) => {
  res.json({ success: true, token: req.cookies['XSRF-TOKEN'] || '' });
});

// Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: true,
}));

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google-auth-failed`,
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    const options = {
      expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };
    res.cookie('token', token, options);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}?google-auth=success`);
  }
);

module.exports = router;
