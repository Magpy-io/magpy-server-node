// Set src dir absolute path
global.__srcdir = __dirname;

// IMPORTS

const { DBFile, rootPath } = require(global.__srcdir + "/config/config");
const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");
const diskManager = require(global.__srcdir + "/modules/diskManager");

databaseFunctions.clearDB();
console.log("Database cleared.");

diskManager.clearImagesDisk();
console.log(rootPath + " directory cleared.");
