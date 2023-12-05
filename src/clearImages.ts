// Set src dir absolute path
global.__srcdir = __dirname;

// IMPORTS

const { rootPath } = require(global.__srcdir + "/config/config");
const { clearDB } = require(global.__srcdir + "/db/databaseFunctions");
const { clearImagesDisk } = require(global.__srcdir + "/modules/diskManager");

clearDB()
  .then(() => {
    console.log("Database cleared.");
  })
  .catch((err) => {
    console.error("Error clearing database");
  });

clearImagesDisk()
  .then(() => {
    console.log(rootPath + " directory cleared.");
  })
  .catch((err) => {
    console.error("Error clearing directory " + rootPath);
  });
