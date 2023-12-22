// IMPORTS
import fs from "fs/promises";
import { createFolder } from "@src/modules/diskManager";
import { serverDataFile } from "@src/config/config";

type ServerData = {
  serverId?: string;
  serverKey?: string;
  serverToken?: string;
  adminUsername?: string;
  adminPasswordHash?: string;
};

async function SaveServerData(data: ServerData) {
  const filePathSplit = serverDataFile.split("/");

  if (filePathSplit.length >= 2) {
    filePathSplit.pop();

    await createFolder(filePathSplit.join("/"));
  }

  await fs.writeFile(serverDataFile, JSON.stringify(data));
}

async function GetServerData(): Promise<ServerData> {
  try {
    const buffer = await fs.readFile(serverDataFile);

    return JSON.parse(buffer.toString());
  } catch (err) {
    return {};
  }
}

async function SetDefaultServerData() {}

export { SaveServerData, GetServerData };

export type { ServerData };
