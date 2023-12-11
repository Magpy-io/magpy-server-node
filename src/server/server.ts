// IMPORTS
import express, { Express } from "express";
import bodyParser from "body-parser";

import { port, serverMdnsName } from "@src/config/config";
import loadEndpoints from "@src/api/endpointsLoader";
import mdns from "mdns";

let app: Express;
let server: any;
let advert: any;

function initServer() {
  app = express();

  app.use(bodyParser.json({ limit: "50mb" }));

  loadEndpoints(app);
  console.log("Endpoints loaded");

  server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });

  return app;
}

function startMdns() {
  advert = mdns.createAdvertisement(mdns.tcp("http"), port, {
    name: serverMdnsName,
  });
  advert.start();
}

function stopServer() {
  if (server) {
    server.close();
  }

  if (advert) {
    advert.stop();
  }
}

export { initServer, stopServer, startMdns };
