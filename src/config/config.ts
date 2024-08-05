import * as os from 'os';
import * as path from 'path';

import { createWriteStream } from 'fs';
import { format } from 'util';

import { getAppDataPath } from 'appdata-path';
import { createFolder } from '../modules/diskBasicFunctions';

const hashLen = 32;
const getPhotoPartSize = 100000; //char in base64
const jwtUserExp = '30d';

const MAX_PIXELS_IN_THUMBNAIL = 40000;
const MAX_PIXELS_IN_COMPRESSED = 200000;

const backend_host = 'http://opencloud-server.onrender.com';
const backend_port = 80;

export const serverDefaultName = 'MyLocalServer';

const rootPath = path.join(os.homedir(), 'OpenCloudPhotos');

export const serverDiscoveryPort = 38951;

let serverDataFileTmp = '';
let sqliteDbFileTmp = '';
let postPhotoPartTimeoutTmp = 0;
let portTmp = '';

if (process.env.NODE_ENV === 'test') {
  sqliteDbFileTmp = ':memory:';
  serverDataFileTmp = path.join('.', 'serverData', 'serverInfo.json');
  postPhotoPartTimeoutTmp = 1000;
  portTmp = '0';
} else if (process.env.NODE_ENV === 'dev') {
  sqliteDbFileTmp = path.join('.', 'db', 'database.db');
  serverDataFileTmp = path.join('.', 'serverData', 'serverInfo.json');
  postPhotoPartTimeoutTmp = 60000;
  portTmp = '8000';
} else {
  // Bundled application
  const appDir = getAppDataPath('magpy');
  sqliteDbFileTmp = path.join(appDir, 'db', 'database.db');
  serverDataFileTmp = path.join(appDir, 'serverData', 'serverInfo.json');
  postPhotoPartTimeoutTmp = 60000;
  portTmp = '8000';

  const logsFilePath = path.join(appDir, 'logs', 'debug.log');
  const logsFilePathParsed = path.parse(logsFilePath);
  createFolder(logsFilePathParsed.dir).then(() => {
    var log_file = createWriteStream(logsFilePath, {
      flags: 'w',
    });
    var log_stdout = process.stdout;
    console.log = function (d) {
      log_file.write(format(d) + '\n');
      log_stdout.write(format(d) + '\n');
    };
    console.error = function (d) {
      log_file.write(format(d) + '\n');
      log_stdout.write(format(d) + '\n');
    };
  });
}

const serverDataFile = serverDataFileTmp;
const sqliteDbFile = sqliteDbFileTmp;
const postPhotoPartTimeout = postPhotoPartTimeoutTmp;
const port = portTmp;

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
};
