const { createLogger, format, transports } = require('winston')
const { timestamp, combine, printf, errors, json } = format

// Log formatı
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`
})

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }), // Error objelerini stack ile yazar
    json() // JSON formatta kayıt tutar
  ),
  transports: [
    new transports.Console({ format: combine(timestamp(), logFormat) }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
})

module.exports = logger
