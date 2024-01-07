// Setting up module-alias
require("module-alias/register");

// IMPORTS
import dotenv from "dotenv";
dotenv.config();

import { clearDB, openAndInitDB, closeDb } from "@src/db/sequelizeDb";
import { clearImagesDisk } from "@src/modules/diskManager";
import { InitModules, ClearModules } from "@src/config/configModules";

async function ResetServer() {
  await InitModules();
  await openAndInitDB();
  console.log("database opened");
  await clearDB();
  console.log("database cleared");
  await closeDb();
  console.log("database closed");
  await clearImagesDisk();
  console.log("storage directory cleared.");
  await ClearModules();
}

ResetServer().catch((err) => {
  console.log(err);
});
