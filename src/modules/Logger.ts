import winston from 'winston';

const { errors, combine, timestamp } = winston.format;

const logLevels = {
  error: 0,
  warn: 1,
  http: 2,
  info: 3,
  debug: 4,
};

function createLogger() {
  return winston.createLogger({
    levels: logLevels,
    level: 'debug',
    format: combine(errors(), timestamp(), winston.format.json()),
    transports: [new winston.transports.Console()],
  });
}

export const Logger = createLogger();
