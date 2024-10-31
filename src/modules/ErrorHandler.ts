import { Logger } from './Logger';

export function setupExceptionsHandler() {
  process.on('uncaughtException', function (err) {
    Logger.error('on uncaughtException', err);
    process.exit(1);
  });
}
