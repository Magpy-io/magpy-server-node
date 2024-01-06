// Setting up module-alias
require("module-alias/register");

// IMPORTS
import dotenv from "dotenv";
dotenv.config();

import { main } from "./mainFunction";

main().catch((err) => {
  console.log("error init server");
  console.log(err);
});
