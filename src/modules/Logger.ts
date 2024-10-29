import winston from 'winston';

const { errors, combine, timestamp, printf } = winston.format;

function createLogger() {
  return winston.createLogger({
    level: 'debug',
    format: combine(
      errors(),
      timestamp(),
      printf(
        info =>
          `[${info.timestamp}] [${info.requestId || '000'}] ${info.level}: ${info.message}`,
      ),
    ),
    transports: [new winston.transports.Console()],
  });
}

export const Logger = createLogger();
