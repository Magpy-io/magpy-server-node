// Setting up module-alias
require("module-alias/register");

// IMPORTS
import config from "dotenv";
config.config();
import { configModules } from "@src/config/configModules";
import { initServer } from "@src/server/server";
import { openAndInitDB } from "@src/db/sequelizeDb";
import { startMdns } from "@src/server/mdnsSetup";

main().catch((err) => {
  console.log("error init server");
  console.log(err);
});

async function main() {
  configModules();
  await openAndInitDB();
  await initServer();
  await startMdns();
}
