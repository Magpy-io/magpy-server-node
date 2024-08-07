import { StdinEventManager } from './StdinEventManager';
import { StdinEventEmitter } from './StdinEventEmitter';

const stdinEventManager = new StdinEventManager();
export const stdinEventEmitter = new StdinEventEmitter();

export function SetupStdinEvents() {
  stdinEventManager.registerEventCallback(stdinEvent => {
    if (stdinEvent.source == 'NOTIFICAITON_ICON') {
      if (stdinEvent.name == 'EXIT') {
        stdinEventEmitter.emit('notification-icon-clicked', 'exit');
      } else if (stdinEvent.name == 'ABOUT') {
        stdinEventEmitter.emit('notification-icon-clicked', 'about');
      }
    } else if (stdinEvent.source == 'ACTION') {
      if (stdinEvent.name == 'OPEN_WEB_INTERFACE') {
        stdinEventEmitter.emit('action', 'open-interface');
      }
    }
  });
}
