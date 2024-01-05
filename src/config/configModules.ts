import { SetPath } from "@src/modules/backendImportedQueries";
import * as config from "@src/config/config";

import log from "electron-log";

export function configModules() {
  const url = config.backend_host + ":" + config.backend_port;
  SetPath(url);

  log.transports.file.level = "debug";
  console.log = log.debug;
  console.error = (message: string) => {
    log.info("#Error Log: " + message);
  };
}
