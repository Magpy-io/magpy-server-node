import open from 'open';
import { port } from '../config/config';
import { stdinEventEmitter } from './StdinEvents';
import { sleep } from './functions';

export async function openInterface() {
  await open(`http://127.0.0.1:${port}`);
}

export function setupOpenInterfaceEvent() {
  stdinEventEmitter.on('notification-icon-clicked', async e => {
    if (e == 'about') {
      await openInterface();
    }
  });
}
