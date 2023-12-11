// Setting up module-alias
require("module-alias/register");

// IMPORTS
import { initServer, startMdns } from "@src/server/server";
import { initDB } from "@src/db/databaseFunctions";

main().catch((err) => {
  console.log("error init server");
  console.log(err);
});

async function main() {
  await initDB();
  initServer();
  startMdns();
}
