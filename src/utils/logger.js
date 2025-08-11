const winston = require('winston');

// Create transports array based on environment
const transports = [];

// Always add console transport
transports.push(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
}));

// Only add file transports in development (when we can write to filesystem)
if (process.env.NODE_ENV !== 'production') {
  try {
    transports.push(
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    );
  } catch (error) {
    // Ignore file transport errors in production environments
    console.log('File logging disabled - using console only');
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'collections-api' },
  transports
});

module.exports = logger;