const crypto = require('crypto');

const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

const setCsrfCookie = (req, res, next) => {
  if (!req.cookies['XSRF-TOKEN']) {
    const token = generateCsrfToken();
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  next();
};

const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.path.startsWith('/api/auth/')) return next();
  const cookieToken = req.cookies['XSRF-TOKEN'];
  const headerToken = req.headers['x-xsrf-token'];
  if (!cookieToken && !headerToken) return next();
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
  }
  next();
};

module.exports = { setCsrfCookie, csrfProtection };
