import { SetPath } from "@src/modules/backendImportedQueries";
import * as config from "@src/config/config";

  
import log from 'electron-log';

export function configModules() {
  const url = config.backend_host + ":" + config.backend_port;
  SetPath(url);


log.transports.file.level = 'info';
console.log = log.info;
console.error = (message:string) => {
  log.info("#Error");
  log.info(message);
}

}
