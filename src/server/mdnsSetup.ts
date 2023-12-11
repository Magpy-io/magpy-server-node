import mdns from "mdns";

import { port, serverMdnsName } from "@src/config/config";

let advert: any;

function startMdns() {
  advert = mdns.createAdvertisement(mdns.tcp("http"), port, {
    name: serverMdnsName,
  });
  advert.start();
}

function stopMdns() {
  if (advert) {
    advert.stop();
  }
}

export { startMdns, stopMdns };
