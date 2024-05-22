import { ServerDataType } from './ServerDataType';
import {
  GetServerDataFromCache,
  SaveServerDataToCache,
  ServerDataDefault,
} from './serverDataCached';
import {
  AssertConfigLoaded,
  ClearServerDataFile,
  SaveServerDataFile,
} from './serverDataFileManager';

export function GetServerConfigData() {
  AssertConfigLoaded();
  return GetServerDataFromCache();
}

export async function SetServerConfigData(data: ServerDataType) {
  SaveServerDataToCache(data);
  await SaveServerDataFile(data);
}

export async function ClearServerConfigData() {
  SaveServerDataToCache(ServerDataDefault);
  await ClearServerDataFile();
}

export async function SaveServerCredentials(
  serverCredentials: {
    serverId: string;
    serverKey: string;
  } | null,
) {
  const dataSaved = GetServerConfigData();
  dataSaved.serverRegisteredInfo.serverCredentials = serverCredentials;
  await SetServerConfigData(dataSaved);
}

export async function SaveServerToken(serverToken: string) {
  const dataSaved = GetServerConfigData();
  dataSaved.serverRegisteredInfo.serverToken = serverToken;
  await SetServerConfigData(dataSaved);
}

export function GetServerCredentials(): {
  serverId: string;
  serverKey: string;
} | null {
  const serverData = GetServerConfigData();

  return serverData.serverRegisteredInfo.serverCredentials;
}

export function GetServerToken(): string | null {
  const serverData = GetServerConfigData();

  return serverData.serverRegisteredInfo.serverToken;
}

export async function ClearServerCredentials() {
  await SaveServerCredentials({ serverId: '', serverKey: '' });
  await SaveServerToken('');
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
