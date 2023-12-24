const hashLen = 32;
const getPhotoPartSize = 100000; //char in base64
const jwtUserExp = "1d";

const MAX_PIXELS_IN_IMAGE = 40000;
const MAX_PIXELS_IN_IMAGE_BIGGER = 200000;

const serverName = "MyLocalServer";
const serverNameMdnsPrefix = "OpenCloudServer";

const serverDataFile = "./serverData/serverInfo.json";

const postPhotoPartTimeoutDev = 60000; //in ms
const rootPathDev = "/home/issam/Documents/Images/";
const sqliteDbFileDev = "./db/database.db";

const postPhotoPartTimeoutTest = 100; //in ms
const rootPathTest = "/home/issam/Documents/Images_test/";
const sqliteDbFileTest = ":memory:";

let sqliteDbFileTmp = "";
let rootPathTmp = "";
let postPhotoPartTimeoutTmp = 0;

if (process.env.NODE_ENV === "test") {
  //supress console.log() when testing
  //console.log = function () {};

  rootPathTmp = rootPathTest;
  sqliteDbFileTmp = sqliteDbFileTest;
  postPhotoPartTimeoutTmp = postPhotoPartTimeoutTest;
} else {
  rootPathTmp = rootPathDev;
  sqliteDbFileTmp = sqliteDbFileDev;
  postPhotoPartTimeoutTmp = postPhotoPartTimeoutDev;
}

const sqliteDbFile = sqliteDbFileTmp;
const rootPath = rootPathTmp;
const postPhotoPartTimeout = postPhotoPartTimeoutTmp;

export {
  rootPath,
  hashLen,
  sqliteDbFile,
  postPhotoPartTimeout,
  getPhotoPartSize,
  MAX_PIXELS_IN_IMAGE,
  MAX_PIXELS_IN_IMAGE_BIGGER,
  serverDataFile,
  jwtUserExp,
  serverName,
  serverNameMdnsPrefix,
};
