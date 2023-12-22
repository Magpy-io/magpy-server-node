// IMPORTS
import fs from "fs/promises";
import { createFolder } from "@src/modules/diskManager";
import { serverDataFile } from "@src/config/config";

export type ServerData = {
  serverId?: string;
  serverKey?: string;
  serverToken?: string;
  adminUsername?: string;
  adminPasswordHash?: string;
};

async function CreateFileIfDoesNotExist() {
  const filePathSplit = serverDataFile.split("/");

  if (filePathSplit.length >= 2) {
    filePathSplit.pop();

    await createFolder(filePathSplit.join("/"));
  }

  try {
    await fs.access(serverDataFile);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      //The file does not exist
      await fs.writeFile(serverDataFile, JSON.stringify({}));
    } else {
      throw error;
    }
  }
}

export async function SaveServerData(data: ServerData) {
  const filePathSplit = serverDataFile.split("/");

  if (filePathSplit.length >= 2) {
    filePathSplit.pop();

    await createFolder(filePathSplit.join("/"));
  }

  await fs.writeFile(serverDataFile, JSON.stringify(data));
}

export async function GetServerData(): Promise<ServerData> {
  await CreateFileIfDoesNotExist();
  try {
    const buffer = await fs.readFile(serverDataFile);

    return JSON.parse(buffer.toString());
  } catch (err) {
    console.error("Error reading ServerData");
    throw err;
  }
}

export async function AddServerDataIfMissing() {
  const data = await GetServerData();
}
