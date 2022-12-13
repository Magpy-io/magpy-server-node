// IMPORTS
const path = require("node:path");
const fs = require("mz/fs");
const config = require("./config");

// CONFIG
const DBFile = config.DBFile;

const obj = {
  photos: [],
};
const str = JSON.stringify(obj);
fs.writeFile(DBFile, str, "utf8");
console.log("Database cleared.");

fs.readdir(config.rootPath, (err, files) => {
  if (err) throw err;

  for (const file of files) {
    fs.unlink(path.join(config.rootPath, file), (err) => {
      if (err) throw err;
    });
  }
});

console.log(config.rootPath + " directory cleared.");
