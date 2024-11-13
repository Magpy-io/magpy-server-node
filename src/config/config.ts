import * as os from 'os';
import * as path from 'path';

import { getAppDataPath } from 'appdata-path';

const hashLen = 32;
const getPhotoPartSize = 100000; //char in base64
const jwtUserExp = '30d';

const MAX_PIXELS_IN_THUMBNAIL = 40000;
const MAX_PIXELS_IN_COMPRESSED = 200000;

const backend_host = 'http://opencloud-server.onrender.com';
const backend_port = 80;

export const serverDefaultName = 'MyLocalServer';

const rootPath = path.join(os.homedir(), 'Magpy Photos');

export const serverDiscoveryPort = 38951;

export const logLevels = {
  error: 0,
  warn: 1,
  http: 2,
  middleware: 3,
  info: 4,
  debug: 5,
};

export type LogLevel = keyof typeof logLevels;

let serverDataFileTmp = '';
let sqliteDbFileTmp = '';
let postPhotoPartTimeoutTmp = 0;
let portTmp = '';
let logLevelTmp: LogLevel;

if (process.env.NODE_ENV === 'test') {
  sqliteDbFileTmp = ':memory:';
  serverDataFileTmp = path.join('.', 'serverData', 'serverInfo.json');
  postPhotoPartTimeoutTmp = 1000;
  portTmp = '0';
  logLevelTmp = 'debug';
} else if (process.env.NODE_ENV === 'dev') {
  sqliteDbFileTmp = path.join('.', 'db', 'database.db');
  serverDataFileTmp = path.join('.', 'serverData', 'serverInfo.json');
  postPhotoPartTimeoutTmp = 60000;
  portTmp = '31803';
  logLevelTmp = 'debug';
} else {
  // Bundled production application
  const appDir = getAppDataPath('Magpy');
  sqliteDbFileTmp = path.join(appDir, 'db', 'database.db');
  serverDataFileTmp = path.join(appDir, 'serverData', 'serverInfo.json');
  postPhotoPartTimeoutTmp = 60000;
  portTmp = '31803';
  logLevelTmp = 'debug';
}

const serverDataFile = serverDataFileTmp;
const sqliteDbFile = sqliteDbFileTmp;
const postPhotoPartTimeout = postPhotoPartTimeoutTmp;
const port = portTmp;
const logLevel: LogLevel = logLevelTmp;

export {
  rootPath,
  hashLen,
  sqliteDbFile,
  postPhotoPartTimeout,
  getPhotoPartSize,
  MAX_PIXELS_IN_THUMBNAIL,
  MAX_PIXELS_IN_COMPRESSED,
  serverDataFile,
  jwtUserExp,
  port,
  backend_host,
  backend_port,
  logLevel,
};
