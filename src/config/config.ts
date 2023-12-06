import process from "process";

const port = 8000;
const rootPath = "/home/issam/Documents/Images/";
const sqliteDbFile = process.cwd() + "/db/database.db";
const hashLen = 32;
const postPhotoPartTimeout = 15000; //in ms
const getPhotoPartSize = 100000; //char in base64
const serverMdnsName = "OpenCloud-server";

export {
  port,
  rootPath,
  hashLen,
  sqliteDbFile,
  postPhotoPartTimeout,
  getPhotoPartSize,
  serverMdnsName,
};
