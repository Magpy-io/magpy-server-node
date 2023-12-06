const checkTableImagesExistsQuery = () =>
  `SELECT name FROM sqlite_master WHERE type='table' AND name='Images';`;

const createTableImagesQuery = (hashLen: number) =>
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
    CREATE INDEX index_path ON Images (clientPath);
    `;

const dropTableImagesQuery = () => `DROP TABLE IF EXISTS Images;`;

const insertImageQuery =
  () => `INSERT INTO Images (id, name, fileSize, width, height, date, clientPath, syncDate, serverPath, hash)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

const selectByClientPathQuery = (clientPath: string) =>
  `SELECT * FROM Images WHERE clientPath='${clientPath}';`;

const selectAllIdsQuery = () => `SELECT id FROM Images`;

const selectPhotosOffsetCountQuery = (offset: number, count: number) =>
  `SELECT * FROM Images ORDER BY date DESC LIMIT ${count}, ${offset};`;

const selectPhotoByIdQuery = (id: string) =>
  `SELECT * FROM Images WHERE id='${id}'`;

const deletePhotoByIdQuery = (id: string) =>
  `DELETE FROM Images WHERE id='${id}'`;

const selectNextPhotoByDateQuery = (date: string) =>
  `SELECT * FROM Images WHERE date<'${date}' ORDER BY date DESC LIMIT 2`;

const selectPreviousPhotoByDateQuery = (date: string) =>
  `SELECT * FROM Images WHERE date>'${date}' ORDER BY date LIMIT 2`;

const updatePhotoHashByIdQuery = (id: string, hash: string) =>
  `UPDATE Images SET hash = '${hash}' WHERE id='${id}';`;

const updatePhotoClientPathByIdQuery = (id: string, path: string) =>
  `UPDATE Images SET clientPath = '${path}' WHERE id='${id}';`;

export default {
  checkTableImagesExistsQuery,
  createTableImagesQuery,
  dropTableImagesQuery,
  insertImageQuery,
  selectByClientPathQuery,
  selectAllIdsQuery,
  selectPhotosOffsetCountQuery,
  selectPhotoByIdQuery,
  deletePhotoByIdQuery,
  selectNextPhotoByDateQuery,
  selectPreviousPhotoByDateQuery,
  updatePhotoHashByIdQuery,
  updatePhotoClientPathByIdQuery,
};
