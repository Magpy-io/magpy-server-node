// IMPORTS
const fs = require('mz/fs');
const config = require('./config')

// CONFIG
const DBFile = config.DBFile

const obj = {
    photos: []
}
const str = JSON.stringify(obj)
fs.writeFile(DBFile, str, 'utf8');
console.log("Database cleared.")