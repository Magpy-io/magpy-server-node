// IMPORTS
import fs from "fs/promises";
import { createFolder } from "@src/modules/diskManager";
import * as config from "@src/config/config";

export type ServerData = {
  serverId?: string;
  serverKey?: string;
  serverToken?: string;
  storageFolderPath: string;
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

export async function SaveStorageFolderPath(path: string) {
  await CreateFileIfDoesNotExist();

  const dataSaved = await getServerDataFromFile();

  dataSaved.storageFolderPath = path;

  await SaveServerDataFile(dataSaved);
}

export async function GetStorageFolderPath(): Promise<string> {
  const serverData = await GetServerData();

  return serverData.storageFolderPath;
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
  return data;
}

async function CreateFileIfDoesNotExist() {
  const filePathSplit = config.serverDataFile.split("/");

  if (filePathSplit.length >= 2) {
    filePathSplit.pop();

    await createFolder(filePathSplit.join("/"));
  }

  try {
    await fs.access(config.serverDataFile);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      //The file does not exist
      await fs.writeFile(config.serverDataFile, JSON.stringify({}));
    } else {
      throw error;
    }
  }
}
