import winston from 'winston';

const { errors, combine, timestamp } = winston.format;

const logLevels = {
  error: 0,
  warn: 1,
  http: 2,
  middleware: 3,
  info: 4,
  debug: 5,
};

export interface CustomLogger extends winston.Logger {
  middleware: winston.LeveledLogMethod;
}

function createLogger() {
  const logger = winston.createLogger({
    levels: logLevels,
    level: 'debug',
    format: combine(errors({ stack: true }), timestamp(), winston.format.json()),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: 'output.log',
        options: { flags: 'w' },
      }),
    ],
  }) as CustomLogger;

  return logger;
}

export const Logger = createLogger();
