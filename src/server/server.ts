// IMPORTS
import express, { Express } from "express";

import loadEndpoints from "@src/api/endpointsLoader";
import jsonParsingErrorHandler from "@src/middleware/jsonParsingErrorHandler";
import FilesWaiting from "@src/modules/waitingFiles";

let app: Express;
let server: any;

async function initServer() {
  app = express();

  app.use(
    express.json({
      limit: "50mb",
    })
  );

  app.use(jsonParsingErrorHandler);

  loadEndpoints(app);
  console.log("Endpoints loaded");

  return new Promise<Express>((resolve) => {
    server = app.listen(process.env.PORT, () => {
      console.log(`Server is listening on port ${process.env.PORT}`);
      resolve(app);
    });
  });
}

function clearFilesWaiting() {
  const files = Array.from(FilesWaiting.values());
  files.forEach((file) => {
    clearTimeout(file.timeout);
  });
  FilesWaiting.clear();
}

function stopServer() {
  clearFilesWaiting();
  if (server) {
    server.close();
  }
}

export { initServer, stopServer, clearFilesWaiting };
