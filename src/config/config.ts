const port = 8000;
const hashLen = 32;
const postPhotoPartTimeout = 15000; //in ms
const getPhotoPartSize = 100000; //char in base64
const serverMdnsName = "OpenCloud-server";

const MAX_PIXELS_IN_IMAGE = 40000;
const MAX_PIXELS_IN_IMAGE_BIGGER = 200000;

let sqliteDbFileTmp = "";
let rootPathTmp = "";

if (process.env.NODE_ENV === "test") {
  rootPathTmp = "/home/issam/Documents/Images_test/";
  sqliteDbFileTmp = "./db/database_test.db";
} else {
  rootPathTmp = "/home/issam/Documents/Images/";
  sqliteDbFileTmp = "./db/database.db";
}

const sqliteDbFile = sqliteDbFileTmp;
const rootPath = rootPathTmp;

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
