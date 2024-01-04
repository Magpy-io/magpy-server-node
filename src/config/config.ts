import * as path from "path";
import * as os from "os";

const hashLen = 32;
const getPhotoPartSize = 100000; //char in base64
const jwtUserExp = "1d";

const MAX_PIXELS_IN_IMAGE = 40000;
const MAX_PIXELS_IN_IMAGE_BIGGER = 200000;

const backend_host = "http://127.0.0.1";
const backend_port = 8001;

const serverName = "MyLocalServer";
const serverNameMdnsPrefix = "OpenCloudServer";

const postPhotoPartTimeoutDev = 60000; //in ms
const rootPath = path.join(os.homedir(), "OpenCloudPhotos");
const sqliteDbFileDev = path.join(".", "db", "database.db");
const serverDataFile = path.join(".", "serverData", "serverInfo.json");
const portDev = "8000";

const postPhotoPartTimeoutTest = 1000; //in ms
const sqliteDbFileTest = ":memory:";
const portTest = "0";

let sqliteDbFileTmp = "";
let postPhotoPartTimeoutTmp = 0;
let portTmp = "";

if (process.env.NODE_ENV === "test") {
  //supress console.log() when testing
  //console.log = function () {};
  sqliteDbFileTmp = sqliteDbFileTest;
  postPhotoPartTimeoutTmp = postPhotoPartTimeoutTest;
  portTmp = portTest;
} else {
  sqliteDbFileTmp = sqliteDbFileDev;
  postPhotoPartTimeoutTmp = postPhotoPartTimeoutDev;
  portTmp = portDev;
}

const sqliteDbFile = sqliteDbFileTmp;
const postPhotoPartTimeout = postPhotoPartTimeoutTmp;
const port = portTmp;

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
  port,
  backend_host,
  backend_port,
};
