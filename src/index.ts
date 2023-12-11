// Setting up module-alias
require("module-alias/register");

// IMPORTS
import { initServer } from "@src/server/server";
import { initDB } from "@src/db/databaseFunctions";
import { startMdns } from "@src/server/mdnsSetup";

main().catch((err) => {
  console.log("error init server");
  console.log(err);
});

async function main() {
  await initDB();
  initServer();
  startMdns();
}
