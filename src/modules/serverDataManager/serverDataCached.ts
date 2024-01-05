import { ServerData } from "./ServerDataType";
import * as config from "@src/config/config";

export const ServerDataDefault: ServerData = {
  storageFolderPath: config.rootPath,
  serverName: config.serverName,
};

let serverData: ServerData = ServerDataDefault;

export function GetServerDataFromCache() {
  return serverData;
}

export function SaveServerDataToCache(data: ServerData) {
  serverData = data;
}
