// IMPORTS
import express, { Express } from "express";
import bodyParser from "body-parser";

import { port } from "@src/config/config";
import loadEndpoints from "@src/api/endpointsLoader";

let app: Express;
let server: any;

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

function stopServer() {
  if (server) {
    server.close();
  }
}

export { initServer, stopServer };
