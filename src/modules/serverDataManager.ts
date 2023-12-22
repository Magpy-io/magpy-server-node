// IMPORTS
import fs from "fs/promises";
import { createFolder } from "@src/modules/diskManager";
import * as config from "@src/config/config";
import { randomBytes } from "crypto";

export type ServerData = {
  serverId?: string;
  serverKey: string;
  serverToken?: string;
};

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

export type ServerCredentials = {
  serverId?: string;
  serverKey?: string;
  serverToken?: string;
};

export async function SaveServerCredentials(data: ServerCredentials) {
  await CreateFileIfDoesNotExist();

  const dataSaved = await getServerDataFile();

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

export async function GetServerData(): Promise<ServerData> {
  await CreateFileIfDoesNotExist();
  await AddServerDataIfMissing();
  return await getServerDataFile();
}

export async function ClearServerCredentials() {
  await SaveServerCredentials({ serverId: "", serverKey: "", serverToken: "" });
}

async function getServerDataFile(): Promise<ServerData> {
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

async function AddServerDataIfMissing() {
  // const data = await getServerDataFile();
  // let dataChanged = false;
  // if (!data.serverKey) {
  //   data.serverKey = randomBytes(32).toString("hex");
  //   dataChanged = true;
  // }
  // if (dataChanged) {
  //   await SaveServerDataFile(data);
  // }
}
