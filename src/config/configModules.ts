import { SetPath } from "@src/modules/backendImportedQueries";
import * as config from "@src/config/config";

export function configModules() {
  const url = process.env.BACK_HOST + ":" + process.env.BACK_PORT;
  SetPath(url);
}
