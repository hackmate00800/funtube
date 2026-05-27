const xss = require('xss');

const SKIP_FIELDS = new Set(['password', 'confirmPassword', 'currentPassword', 'newPassword', 'token']);

const stripXSS = (value, key) => {
  if (key && SKIP_FIELDS.has(key)) return value;
  if (typeof value === 'string') return xss(value, { whiteList: {} });
  if (Array.isArray(value)) return value.map((v, i) => stripXSS(v, i));
  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const [k, val] of Object.entries(value)) sanitized[k] = stripXSS(val, k);
    return sanitized;
  }
  return value;
};

const xssSanitize = (req, res, next) => {
  if (req.body) req.body = stripXSS(req.body);
  if (req.query) req.query = stripXSS(req.query);
  if (req.params) req.params = stripXSS(req.params);
  next();
};

module.exports = xssSanitize;
