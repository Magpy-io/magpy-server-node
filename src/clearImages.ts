// Setting up module-alias
require("module-alias/register");

// IMPORTS
import dotenv from "dotenv";
dotenv.config();

import { clearImagesDisk, clearDbFile } from "@src/modules/diskManager";
import {
  InitModules,
  ClearModulesKeepServerConfig,
} from "@src/config/configModules";

async function ResetServer() {
  await InitModules();
  await clearDbFile();
  console.log("database cleared");
  await clearImagesDisk();
  console.log("storage directory cleared.");
  await ClearModulesKeepServerConfig();
}

ResetServer().catch((err) => {
  console.log(err);
});
