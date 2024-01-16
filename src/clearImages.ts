// IMPORTS
import dotenv from "dotenv";
dotenv.config();

import { clearImagesDisk, clearDbFile } from "./modules/diskManager";
import {
  InitModules,
  ClearModulesKeepServerConfig,
} from "./config/configModules";

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
