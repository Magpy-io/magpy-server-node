// Setting up module-alias
require("module-alias/register");

// IMPORTS
import { clearDB, openAndInitDB, closeDb } from "@src/db/sequelizeDb";
import { clearImagesDisk } from "@src/modules/diskManager";

openAndInitDB()
  .then(() => {
    console.log("database openend");
    return clearDB();
  })
  .then(() => {
    console.log("database cleared");
    return closeDb();
  })
  .then(() => {
    console.log("database closed");
  })
  .catch((err: any) => {
    console.log("Error clearing database. " + err);
  })
  .then(() => {
    return clearImagesDisk();
  })
  .then(() => {
    console.log("storage directory cleared.");
  })
  .catch((err: any) => {
    console.error("Error clearing storage directory");
  });
