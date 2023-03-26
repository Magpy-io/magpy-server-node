const host = "192.168.0.12";
const port = 8000;
const rootPath = "/home/issam/Documents/Images/";
const sqliteDbFile = __srcdir + "/db/database.db";
const hashLen = 32;
const postPhotoPartTimeout = 100; //in ms
const getPhotoPartSize = 10; //char in base64

module.exports = {
  host,
  port,
  rootPath,
  hashLen,
  sqliteDbFile,
  postPhotoPartTimeout,
  getPhotoPartSize,
};
