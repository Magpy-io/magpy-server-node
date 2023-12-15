// IMPORTS
import fs from "fs/promises";
import { createFolder } from "@src/modules/diskManager";
import { serverDataFolder } from "@src/config/config";

const fileName = "serverInfo.json";
type ServerData = { serverId: string; serverKey: string; serverToken?: string };

async function SaveServerData(data: ServerData) {
  await createFolder(serverDataFolder);

  await fs.writeFile(serverDataFolder + fileName, JSON.stringify(data));
}

async function GetServerData(): Promise<ServerData> {
  try {
    const buffer = await fs.readFile(serverDataFolder + fileName);

    return JSON.parse(buffer.toString());
  } catch (err) {
    return { serverId: "", serverKey: "" };
  }
}

export { SaveServerData, GetServerData };

export type { ServerData };
