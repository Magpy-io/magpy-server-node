// IMPORTS
import fs from "fs/promises";
import { createFolder, pathExists } from "@src/modules/diskManager";
import * as config from "@src/config/config";
import * as path from "path";

export type ServerData = {
  serverId?: string;
  serverKey?: string;
  serverToken?: string;
  storageFolderPath: string;
  serverName: string;
};

export async function GetServerData(): Promise<ServerData> {
  await CreateFileIfDoesNotExist();
  const data = await getServerDataFromFile();
  const dataWithDefaults = AddServerDataIfMissing(data);
  return dataWithDefaults;
}

export type ServerCredentials = {
  serverId?: string;
  serverKey?: string;
  serverToken?: string;
};

export async function SaveServerCredentials(data: ServerCredentials) {
  await CreateFileIfDoesNotExist();

  const dataSaved = await getServerDataFromFile();

  if (data.serverId !== undefined) {
    dataSaved.serverId = data.serverId;
  }
  if (data.serverKey !== undefined) {
    dataSaved.serverKey = data.serverKey;
  }
  if (data.serverToken !== undefined) {
    dataSaved.serverToken = data.serverToken;
  }

  await SaveServerDataFile(dataSaved);
}

export async function GetServerCredentials(): Promise<ServerCredentials> {
  const serverData = await GetServerData();

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
  await CreateFileIfDoesNotExist();

  const dataSaved = await getServerDataFromFile();

  dataSaved.storageFolderPath = pathStorageFolder;

  await SaveServerDataFile(dataSaved);
}

export async function GetStorageFolderPath(): Promise<string> {
  const serverData = await GetServerData();

  return serverData.storageFolderPath;
}

export async function SaveServerName(name: string) {
  await CreateFileIfDoesNotExist();

  const dataSaved = await getServerDataFromFile();

  dataSaved.serverName = name;

  await SaveServerDataFile(dataSaved);
}

export async function GetServerName(): Promise<string> {
  const serverData = await GetServerData();

  return serverData.serverName;
}

async function getServerDataFromFile(): Promise<any> {
  try {
    const buffer = await fs.readFile(config.serverDataFile);

    return JSON.parse(buffer.toString());
  } catch (err) {
    console.error("Error reading ServerData");
    throw err;
  }
}

async function SaveServerDataFile(data: ServerData) {
  await CreateFileIfDoesNotExist();

  await fs.writeFile(config.serverDataFile, JSON.stringify(data));
}

function AddServerDataIfMissing(data: any): ServerData {
  if (!data.storageFolderPath) {
    data.storageFolderPath = config.rootPath;
  }

  if (!data.serverName) {
    data.serverName = config.serverName;
  }

  return data;
}

async function CreateFileIfDoesNotExist() {
  const parsed = path.parse(config.serverDataFile);
  await createFolder(parsed.dir);
  if (!(await pathExists(config.serverDataFile))) {
    await fs.writeFile(config.serverDataFile, JSON.stringify({}));
  }
}
