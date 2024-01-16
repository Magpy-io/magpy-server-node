import { ServerDataType } from "./ServerDataType";
import * as config from "../../config/config";

export const ServerDataDefault: ServerDataType = {
  storageFolderPath: config.rootPath,
  serverName: config.serverName,
};

let serverData: ServerDataType = ServerDataDefault;

export function GetServerDataFromCache() {
  return serverData;
}

export function SaveServerDataToCache(data: ServerDataType) {
  serverData = data;
}
