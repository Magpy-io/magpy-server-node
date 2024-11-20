import { logLevel, logLevels } from '../config/config';
import winston from 'winston';

const { errors, combine, timestamp } = winston.format;

export interface CustomLogger extends winston.Logger {
  middleware: winston.LeveledLogMethod;
}

const transports: winston.transport[] = [new winston.transports.Console()];

if (process.env.NODE_ENV == 'dev') {
  transports.push(
    new winston.transports.File({
      filename: '.tmp/output.log',
      options: { flags: 'w' },
    }),
  );
}

function createLogger() {
  const logger = winston.createLogger({
    levels: logLevels,
    level: logLevel,
    format: combine(errors({ stack: true }), timestamp(), winston.format.json()),
    transports,
  }) as CustomLogger;

  return logger;
}

export const Logger = createLogger();
