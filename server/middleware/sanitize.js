const xss = require('xss');

const stripXSS = (value) => {
  if (typeof value === 'string') return xss(value, { whiteList: {} });
  if (Array.isArray(value)) return value.map(stripXSS);
  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) sanitized[key] = stripXSS(val);
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
