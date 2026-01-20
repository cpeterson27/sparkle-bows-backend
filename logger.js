const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, json } = format;

const consoleFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level.toUpperCase()}: ${message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    json()
  ),
  transports: [
    new transports.Console({
      format: combine(timestamp(), consoleFormat)
    }),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" })
  ],
  exitOnError: false
});

module.exports = logger;
