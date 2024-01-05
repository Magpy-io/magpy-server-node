import { ServerData } from "./ServerDataType";
import {
  GetServerDataFromCache,
  SaveServerDataToCache,
  ServerDataDefault,
} from "./serverDataCached";

import {
  AssertConfigLoaded,
  SaveServerDataFile,
  ClearServerDataFile,
} from "./serverDataFileManager";

export function GetServerConfigData() {
  AssertConfigLoaded();
  return GetServerDataFromCache();
}

export async function SetServerConfigData(data: ServerData) {
  SaveServerDataToCache(data);
  await SaveServerDataFile(data);
}

export async function ClearServerConfigData() {
  SaveServerDataToCache(ServerDataDefault);
  await ClearServerDataFile();
}

export type ServerCredentials = {
  serverId?: string;
  serverKey?: string;
  serverToken?: string;
};

export async function SaveServerCredentials(data: ServerCredentials) {
  const dataSaved = GetServerConfigData();

  const dataUpdated = { ...dataSaved, ...data };

  await SetServerConfigData(dataUpdated);
}

export function GetServerCredentials(): ServerCredentials {
  const serverData = GetServerConfigData();

  return {
    serverId: serverData.serverId,
    serverKey: serverData.serverKey,
    serverToken: serverData.serverToken,
  };
}

export async function ClearServerCredentials() {
  await SaveServerCredentials({ serverId: "", serverKey: "", serverToken: "" });
}

export async function SaveStorageFolderPath(pathStorageFolder: string) {
  const dataSaved = GetServerConfigData();
  dataSaved.storageFolderPath = pathStorageFolder;
  await SetServerConfigData(dataSaved);
}

export function GetStorageFolderPath(): string {
  const serverData = GetServerConfigData();

  return serverData.storageFolderPath;
}

export async function SaveServerName(name: string) {
  const dataSaved = GetServerConfigData();

  dataSaved.serverName = name;

  await SetServerConfigData(dataSaved);
}

export function GetServerName(): string {
  const serverData = GetServerConfigData();

  return serverData.serverName;
}
