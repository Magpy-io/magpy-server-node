import { Logger } from './Logger';

export function setupExceptionsLogger() {
  process.on('uncaughtExceptionMonitor', function (err) {
    Logger.error(err);
  });

  process.on('unhandledRejection', function (err) {
    Logger.error('Promise unhandledRejection', { error: err, type: 'unhandledRejection' });
  });
}
