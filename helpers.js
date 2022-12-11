const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');
const fs = require('mz/fs');

function sendResponse(res, ok, status, data){
  let jsonResponse = {
      ok: ok,
      data: data,      
  }

  res.status(status).json(jsonResponse)
}

function sendSuccessfulResponse(res, msg, status=200){
    let jsonResponse = {
        ok: true,
        message: msg,
    }

    res.status(status).json(jsonResponse)
}

function sendFailedResponse(res, msg, status=500){
    let jsonResponse = {
        ok: false,
        message: msg
    }

    res.status(status).json(jsonResponse)
}

  
function splitImageName(name){
    return {name : name.split('.')[0], format: name.split('.')[1]}
}

function serverImageName(imageName){
    const {name, format} = splitImageName(imageName)
    const date = new Date(Date.now()).toJSON()
    const serverFileName = `ANTS_${name}_${date}.${format}`
    return serverFileName
}

function addPhotoToDisk(res, data, filePath){
    let buff = Buffer.from(data, 'base64');
      fs.writeFile(filePath, buff, (err) => {
        if (err) {
            sendFailedResponse(res, err)
            console.log(err)
        } else {
            const message = "File written successfully"
            sendSuccessfulResponse(res, message)
            console.log(message)
        }
      });
  }
  

function addPhotoToDB(photo){

    fs.readFile('photos.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
      newEntry = {
        id:uuidv4(),
        name: photo.name,
        fileSize: photo.fileSize,
        width: photo.width,
        height: photo.height,
        date: photo.date,
        syncDate: new Date(Date.now()).toJSON()
      }
      obj = JSON.parse(data); //now it an object
      obj.photos.push(newEntry); //add some data
      json = JSON.stringify(obj); //convert it back to json
      fs.writeFile('photos.json', json, 'utf8'); // write it back 
    }});
  
  }

  function areEqual(p, photo){
    if(p.name === photo.name && p.date === photo.date){
        return true
    } 
    return false
  }

  function isPhotoInDB(photo){

    data = fs.readFileSync('photos.json', 'utf8');
    obj = JSON.parse(data); 
    isInDB = obj.photos.some((p)=>areEqual(p, photo))

    return isInDB
  }

  function numberPhotosFromDB(){
    data = fs.readFileSync('photos.json', 'utf8');
    obj = JSON.parse(data); 
    return obj.photos.length
  }

module.exports = {
  sendResponse,
  sendSuccessfulResponse,
  sendFailedResponse,
  splitImageName,
  serverImageName,
  addPhotoToDisk,
  addPhotoToDB,
  isPhotoInDB,
  numberPhotosFromDB
};