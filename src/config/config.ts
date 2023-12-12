const port = 8000;
const hashLen = 32;
const postPhotoPartTimeout = 15000; //in ms
const getPhotoPartSize = 100000; //char in base64
const serverMdnsName = "OpenCloud-server";

const MAX_PIXELS_IN_IMAGE = 40000;
const MAX_PIXELS_IN_IMAGE_BIGGER = 200000;

const rootPathTest = "/home/issam/Documents/Images_test/";
const rootPathDev = "/home/issam/Documents/Images/";
const sqliteDbFileTest = "./db/database_test.db";
const sqliteDbFileDev = "./db/database.db";

let sqliteDbFileTmp = "";
let rootPathTmp = "";
if (process.env.NODE_ENV === "test") {
  rootPathTmp = rootPathTest;
  sqliteDbFileTmp = sqliteDbFileTest;
} else {
  rootPathTmp = rootPathDev;
  sqliteDbFileTmp = sqliteDbFileDev;
}

const sqliteDbFile = sqliteDbFileTmp;
const rootPath = rootPathTmp;

if (process.env.NODE_ENV == "test") {
  console.log = function () {};
}

export {
  port,
  rootPath,
  hashLen,
  sqliteDbFile,
  postPhotoPartTimeout,
  getPhotoPartSize,
  serverMdnsName,
  MAX_PIXELS_IN_IMAGE,
  MAX_PIXELS_IN_IMAGE_BIGGER,
};
