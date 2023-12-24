import { serverNameMdnsPrefix } from "@src/config/config";
import { GetServerName } from "@src/modules/serverDataManager";
import mdns from "mdns";

let advert: any;

async function startMdns() {
  advert = mdns.createAdvertisement(
    mdns.tcp("http"),
    parseInt(process.env.PORT || "8000"),
    {
      name: serverNameMdnsPrefix + (await GetServerName()),
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
