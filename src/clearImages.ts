// IMPORTS
import { rootPath } from "@src/config/config";
import { clearDB } from "@src/db/databaseFunctions";
import { clearImagesDisk } from "@src/modules/diskManager";

clearDB()
  .then(() => {
    console.log("Database cleared.");
  })
  .catch((err: any) => {
    console.error("Error clearing database");
  });

clearImagesDisk()
  .then(() => {
    console.log(rootPath + " directory cleared.");
  })
  .catch((err: any) => {
    console.error("Error clearing directory " + rootPath);
  });
