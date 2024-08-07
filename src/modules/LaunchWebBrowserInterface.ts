import open from 'open';
import { port } from '../config/config';
import { stdinEventEmitter } from './StdinEvents';

export async function openInterface() {
  await open(`http://127.0.0.1:${port}`);
}

export function setupOpenInterfaceEvent() {
  stdinEventEmitter.on('notification-icon-clicked', async e => {
    if (e == 'about') {
      await openInterface();
    }
  });

  stdinEventEmitter.on('action', async e => {
    if (e == 'open-interface') {
      await openInterface();
    }
  });
}
