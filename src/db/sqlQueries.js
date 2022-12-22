const checkTableImagesExistsQuery = () =>
  `SELECT name FROM sqlite_master WHERE type='table' AND name='Images';`;

const createTableImagesQuery = (hashLen) =>
  `CREATE TABLE Images( 
    id varchar(36) PRIMARY KEY,
    name varchar(255) NOT NULL, 
    fileSize int,
    width int,
    height int, 
    date varchar(32), 
    clientPath varchar(255), 
    syncDate varchar(32), 
    serverPath varchar(255), 
    hash varchar(${hashLen}));`;

const dropTableImagesQuery = () => `DROP TABLE IF EXISTS Images;`;

const insertImageQuery =
  () => `INSERT INTO Images (id, name, fileSize, width, height, date, clientPath, syncDate, serverPath, hash)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

const selectByNameAndSizeQuery = (name, size) =>
  `SELECT * FROM Images WHERE name='${name}' AND fileSize=${size};`;

const selectAllIdsQuery = () => `SELECT id FROM Images`;

const selectPhotosOffsetCountQuery = (offset, count) =>
  `SELECT * FROM Images LIMIT ${count}, ${offset};`;

const selectPhotoByIdQuery = (id) => `SELECT * FROM Images WHERE id='${id}'`;

module.exports = {
  checkTableImagesExistsQuery,
  createTableImagesQuery,
  dropTableImagesQuery,
  insertImageQuery,
  selectByNameAndSizeQuery,
  selectAllIdsQuery,
  selectPhotosOffsetCountQuery,
  selectPhotoByIdQuery,
};
