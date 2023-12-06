// Setting up module-alias
require("module-alias/register");

// IMPORTS
import express from "express";
import bodyParser from "body-parser";

import { port, serverMdnsName } from "@src/config/config";
import loadEndpoints from "@src/api/endpointsLoader";
import { initDB } from "@src/db/databaseFunctions";
import mdns from "mdns";

initDB()
  .then(() => {
    console.log("Database initialized.");

    const app = express();

    app.use(bodyParser.json({ limit: "50mb" }));

    loadEndpoints(app);
    console.log("Endpoints loaded");

    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });

    const advert = mdns.createAdvertisement(mdns.tcp("http"), port, {
      name: serverMdnsName,
    });
    advert.start();
  })
  .catch((err: any) => {
    console.error("Error initializing database");
    console.log(err);
  });