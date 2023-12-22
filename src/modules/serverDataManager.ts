// IMPORTS
import fs from "fs/promises";
import { createFolder } from "@src/modules/diskManager";
import * as config from "@src/config/config";
import { hashPassword } from "@src/modules/functions";

export type ServerData = {
  serverId?: string;
  serverKey?: string;
  serverToken?: string;
  adminUsername: string;
  adminPasswordHash: string;
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

  await fs.writeFile(config.serverDataFile, JSON.stringify(data));
}

export async function GetServerData(): Promise<ServerData> {
  await CreateFileIfDoesNotExist();
  await AddServerDataIfMissing();
  return getServerDataFile();
}

async function getServerDataFile() {
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
  const data = await getServerDataFile();

  if (!data.adminPasswordHash || !data.adminUsername) {
    data.adminUsername = data.adminUsername || config.defaultAdminUsername;
    data.adminPasswordHash =
      data.adminPasswordHash || config.defaultAdminPasswordHashed;
    await SaveServerDataFile(data);
  }
}
