import Joi from 'joi';
import { Logger } from '../Logger';

const mainAppEventSchema = Joi.object({
  source: Joi.string().required(),
  name: Joi.string().required(),
});

export type MainAppEventType = {
  source: string;
  name: string;
};

function tryParseJSON(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

export class StdinEventManager {
  private lastListener: ((data: Buffer) => void) | null;

  constructor() {
    this.lastListener = null;
  }

  registerEventCallback(f: (e: MainAppEventType) => void) {
    this.removeEventCallback();

    this.lastListener = data => {
      const e = tryParseJSON(data.toString());

      if (!e) {
        Logger.warn('Invalid data received on stdin: ' + data.toString());
        return;
      }

      const { error, value } = mainAppEventSchema.validate(e);

      if (error) {
        Logger.warn('Invalid data received on stdin: ' + data.toString());
        return;
      }

      const eventParsed = value as MainAppEventType;
      f(eventParsed);
    };
    process.stdin.on('data', this.lastListener);
  }

  removeEventCallback() {
    if (this.lastListener != null) {
      process.stdin.removeListener('data', this.lastListener);
      this.lastListener = null;
    }
  }
}
