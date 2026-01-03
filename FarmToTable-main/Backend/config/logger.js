const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Write all logs to console
    new winston.transports.Console({
        format: winston.format.simple(),
    }),
    // Write errors to a file
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

module.exports = logger;