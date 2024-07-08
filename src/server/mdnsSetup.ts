import mdns from 'mdns';

import { port, serverNameMdnsPrefix } from '../config/config';
import { GetServerName } from '../modules/serverDataManager';

let advert: ReturnType<typeof mdns.createAdvertisement>;

function startMdns() {
  advert = mdns.createAdvertisement(mdns.tcp('http'), parseInt(port), {
    name: serverNameMdnsPrefix + GetServerName(),
  });
  advert.start();
}

function stopMdns() {
  if (advert) {
    advert.stop();
  }
}

export { startMdns, stopMdns };
