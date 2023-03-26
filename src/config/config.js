const host = "192.168.0.12";
const port = 8000;
const rootPath = "/home/issam/Documents/Images/";
const sqliteDbFile = __srcdir + "/db/database.db";
const hashLen = 32;
const postPhotoPartTimeout = 2000; //in ms
const getPhotoPartSize = 100000; //char in base64

module.exports = {
  host,
  port,
  rootPath,
  hashLen,
  sqliteDbFile,
  postPhotoPartTimeout,
  getPhotoPartSize,
};
