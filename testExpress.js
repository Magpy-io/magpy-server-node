// IMPORTS
const helpers = require('./helpers');
const config = require('./config')
const express = require('express')
const fs = require('mz/fs');
const bodyParser = require('body-parser');

// CONFIG 
const host = config.host;
const port = config.port
const rootPath = config.rootPath

// Create app
const app = express()

// Use bodyParser to automatically parse request bodies to json
app.use(bodyParser.json({limit: '50mb'}));

// Listen to requests
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
})


// ---------------------------------------------------------------------------- GET requests

// GET /numberPhotos : return the number of photos in the server. 
app.get('/numberPhotos', (req, res) => {
  const nb = helpers.numberPhotosFromDB()
  helpers.sendResponse(res, true, 200, {
    number: nb
  })
})  

// GET /photos with pagination params : returns number photos starting from offset. 
app.get('/photos/:number/:offset', (req, res) => {
  
  const number = req.params["number"] ?? 10
  const offset = req.params["offset"] ?? 0
  const {dbPhotos, endReached} = helpers.getPhotosFromDB(number, offset)
  const photos = helpers.getPhotosFromDisk(dbPhotos)
  const jsonResponse = {
    endReached: endReached,
    photos: photos,
  }

  helpers.sendResponse(res, true, 200, jsonResponse)
})

// GET /photos : returns all photos in server. 
app.get('/photos', (req, res) => {
  
  const dbPhotos = helpers.getAllPhotosFromDB()
  const photos = helpers.getPhotosFromDisk(dbPhotos)
  const jsonResponse = {
    number: photos.length,
    photos: photos,
  }

  helpers.sendResponse(res, true, 200, jsonResponse)
})


// ---------------------------------------------------------------------------- POST requests

/* POST /photo : adds a photo to the server
  Request body is a json that looks like: 
  {
    "name": "name",
    "fileSize": 1000,
    "width": 1000,
    "height": 1000,
    "date": "2022-12-11T17:27:58.396Z",
    "base64": image64 data
  } */
  
app.post('/photo', (req,res) => {

  if(helpers.isPhotoInDB(req.body)){
    const msg = "Photo already added to server."
    console.log(msg)
    helpers.sendFailedResponse(res, msg, 409)
  }else{
    const serverFilePath = rootPath + helpers.serverImageName(req.body.name)
    helpers.addPhotoToDB(req.body, serverFilePath)
    helpers.addPhotoToDisk(res, req.body.image64, serverFilePath)   
  }

})
