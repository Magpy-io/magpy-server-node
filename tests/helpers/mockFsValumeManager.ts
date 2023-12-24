import { vol } from "memfs";
import { serverDataFile } from "@src/config/config";

export function AddServerData(serverData: any) {
  const rootPathFile = serverDataFile;
  const json: any = {};

  json[rootPathFile] = JSON.stringify(serverData);
  vol.fromJSON(json, "./");
}
