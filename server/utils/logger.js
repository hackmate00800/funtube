const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const getLogStream = (type) => {
  const date = new Date().toISOString().split('T')[0];
  return fs.createWriteStream(path.join(logDir, `${type}-${date}.log`), { flags: 'a' });
};

const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  return JSON.stringify({ timestamp, level, message, ...meta }) + '\n';
};

const logger = {
  info: (message, meta) => {
    const log = formatLog('INFO', message, meta);
    console.log(`[INFO] ${message}`);
    getLogStream('info').write(log);
  },
  warn: (message, meta) => {
    const log = formatLog('WARN', message, meta);
    console.warn(`[WARN] ${message}`);
    getLogStream('error').write(log);
  },
  error: (message, meta) => {
    const log = formatLog('ERROR', message, meta);
    console.error(`[ERROR] ${message}`);
    getLogStream('error').write(log);
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV === 'development') {
      const log = formatLog('DEBUG', message, meta);
      console.debug(`[DEBUG] ${message}`);
      getLogStream('debug').write(log);
    }
  },
};

module.exports = logger;
