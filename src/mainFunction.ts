import { InitModules } from "./config/configModules";
import { initServer } from "./server/server";
import { openAndInitDB } from "./db/sequelizeDb";
import { startMdns } from "./server/mdnsSetup";

export async function main() {
  await InitModules();
  await openAndInitDB();
  await initServer();
  startMdns();
}
