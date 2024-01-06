import { InitModules } from "@src/config/configModules";
import { initServer } from "@src/server/server";
import { openAndInitDB } from "@src/db/sequelizeDb";
import { startMdns } from "@src/server/mdnsSetup";

export async function main() {
  await InitModules();
  await openAndInitDB();
  await initServer();
  await startMdns();
}
