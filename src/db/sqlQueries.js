const checkTableImagesExistsQuery = () =>
  `SELECT name FROM sqlite_master WHERE type='table' AND name='Images';`;

const createTableImagesQuery = (hashLen) =>
  `CREATE TABLE Images( 
    id varchar(36) PRIMARY KEY,
    name varchar(255) NOT NULL, 
    fileSize int,
    width int,
    height int, 
    date DATETIME, 
    clientPath varchar(255), 
    syncDate DATETIME, 
    serverPath varchar(255), 
    hash varchar(${hashLen}));
    
    CREATE INDEX index_date ON Images (date);
    `;

const dropTableImagesQuery = () => `DROP TABLE IF EXISTS Images;`;

const insertImageQuery =
  () => `INSERT INTO Images (id, name, fileSize, width, height, date, clientPath, syncDate, serverPath, hash)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

const selectByNameAndSizeQuery = (name, size) =>
  `SELECT * FROM Images WHERE name='${name}' AND fileSize=${size};`;

const selectAllIdsQuery = () => `SELECT id FROM Images`;

const selectPhotosOffsetCountQuery = (offset, count) =>
  `SELECT * FROM Images ORDER BY date DESC LIMIT ${count}, ${offset};`;

const selectPhotoByIdQuery = (id) => `SELECT * FROM Images WHERE id='${id}'`;

const selectNextPhotoByDateQuery = (date) =>
  `SELECT * FROM Images WHERE date<'${date}' ORDER BY date DESC LIMIT 2`;

const selectPreviousPhotoByDateQuery = (date) =>
  `SELECT * FROM Images WHERE date>'${date}' ORDER BY date LIMIT 2`;

module.exports = {
  checkTableImagesExistsQuery,
  createTableImagesQuery,
  dropTableImagesQuery,
  insertImageQuery,
  selectByNameAndSizeQuery,
  selectAllIdsQuery,
  selectPhotosOffsetCountQuery,
  selectPhotoByIdQuery,
  selectNextPhotoByDateQuery,
  selectPreviousPhotoByDateQuery,
};
