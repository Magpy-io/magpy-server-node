// IMPORTS
const path = require("node:path");
const fs = require("mz/fs");

const { DBFile, rootPath } = require(global.__srcdir + "/config/config");

const obj = {
  photos: [],
};
const str = JSON.stringify(obj);
fs.writeFile(DBFile, str, "utf8");
console.log("Database cleared.");

fs.readdir(rootPath, (err, files) => {
  if (err) throw err;

  for (const file of files) {
    fs.unlink(path.join(rootPath, file), (err) => {
      if (err) throw err;
    });
  }
});
console.log(rootPath + " directory cleared.");
