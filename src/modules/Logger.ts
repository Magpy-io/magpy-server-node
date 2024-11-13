import { logLevel, logLevels } from '../config/config';
import winston from 'winston';

const { errors, combine, timestamp } = winston.format;

export interface CustomLogger extends winston.Logger {
  middleware: winston.LeveledLogMethod;
}

function createLogger() {
  const logger = winston.createLogger({
    levels: logLevels,
    level: logLevel,
    format: combine(errors({ stack: true }), timestamp(), winston.format.json()),
    transports: process.env.NODE_ENV == 'dev' ? transportsDev : transportsProd,
  }) as CustomLogger;

  return logger;
}

const transportsDev = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: '.tmp/output.log',
    options: { flags: 'w' },
  }),
];

const transportsProd = [new winston.transports.Console()];

export const Logger = createLogger();

if (process.env.NODE_ENV == 'test') {
  Logger.silent = true;
}
