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

function GetServerConfigData() {
  AssertConfigLoaded();
  return GetServerDataFromCache();
}

async function SetServerConfigData(data: ServerDataType) {
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
  },
) {
  const dataSaved = GetServerConfigData();
  
  if(dataSaved.serverRegisteredInfo == null){
    dataSaved.serverRegisteredInfo = {serverCredentials:serverCredentials}
  }else{
    dataSaved.serverRegisteredInfo.serverCredentials = serverCredentials;
  }
  await SetServerConfigData(dataSaved);
}

export async function SaveServerToken(serverToken: string) {
  const dataSaved = GetServerConfigData();

  if(dataSaved.serverRegisteredInfo == null){
    throw new Error("SaveServerToken: Saving server token but there is not saved credentials.")  
  }
  
  dataSaved.serverRegisteredInfo.serverToken = serverToken;

  await SetServerConfigData(dataSaved);
}

export function GetServerCredentials(): {
  serverId: string;
  serverKey: string;
} | null {
  const serverData = GetServerConfigData();

  return serverData.serverRegisteredInfo?.serverCredentials ?? null;
}

export function GetServerToken(): string | null {
  const serverData = GetServerConfigData();

  return serverData.serverRegisteredInfo?.serverToken ?? null;
}

export async function ClearServerCredentials() {
  const dataSaved = GetServerConfigData();  
  dataSaved.serverRegisteredInfo = null;
  await SetServerConfigData(dataSaved);
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
