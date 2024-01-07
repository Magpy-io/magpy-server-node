import { serverNameMdnsPrefix, port } from "@src/config/config";
import { GetServerName } from "@src/modules/serverDataManager";
import mdns from "mdns";

let advert: any;

function startMdns() {
  advert = mdns.createAdvertisement(
    mdns.tcp("http"),
    parseInt(port || "8000"),
    {
      name: serverNameMdnsPrefix + GetServerName(),
    }
  );
  advert.start();
}

function stopMdns() {
  if (advert) {
    advert.stop();
  }
}

export { startMdns, stopMdns };
