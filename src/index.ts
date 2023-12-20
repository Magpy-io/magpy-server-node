// Setting up module-alias
require("module-alias/register");

// IMPORTS
import config from "dotenv";
config.config();
import { initServer } from "@src/server/server";
import { openAndInitDB } from "@src/db/sequelizeDb";
import { startMdns } from "@src/server/mdnsSetup";
import { getMyIp } from "@src/modules/getMyIp";
main().catch((err) => {
  console.log("error init server");
  console.log(err);
});

async function main() {
  const ip = await getMyIp();
  console.log(ip);
  await openAndInitDB();
  await initServer();
  startMdns();
}
