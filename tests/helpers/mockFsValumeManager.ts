import { vol } from "memfs";
import { serverDataFolder } from "@src/config/config";

export function AddServerData(serverData: any) {
  const rootPathFile = serverDataFolder + "serverInfo.json";
  const json: any = {};

  json[rootPathFile] = JSON.stringify(serverData);
  vol.fromJSON(json, "./");
}
