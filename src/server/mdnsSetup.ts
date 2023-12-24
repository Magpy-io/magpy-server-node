import mdns from "mdns";

let advert: any;

function startMdns() {
  advert = mdns.createAdvertisement(
    mdns.tcp("http"),
    parseInt(process.env.PORT || "8000"),
    {
      name: process.env.SERVER_MDNS_NAME,
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
