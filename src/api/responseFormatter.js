// IMPORTS

function sendResponse(res, ok, status, data) {
  let jsonResponse = {
    ok: ok,
    data: data,
  };

  res.status(status).json(jsonResponse);
}

function sendSuccessfulResponse(res, msg, status = 200) {
  let jsonResponse = {
    ok: true,
    message: msg,
  };

  res.status(status).json(jsonResponse);
}

function sendFailedResponse(res, msg, status = 500) {
  let jsonResponse = {
    ok: false,
    message: msg,
  };

  res.status(status).json(jsonResponse);
}

function createPhotoObject(dbPhoto, image64) {
  return {
    id: dbPhoto.id,
    meta: {
      name: dbPhoto.name,
      fileSize: dbPhoto.fileSize,
      width: dbPhoto.width,
      height: dbPhoto.height,
      date: dbPhoto.date,
      syncDate: dbPhoto.syncDate,
      serverPath: dbPhoto.serverPath,
      clientPath: dbPhoto.clientPath,
    },
    image64: image64,
  };
}

module.exports = {
  sendResponse,
  sendSuccessfulResponse,
  sendFailedResponse,
  createPhotoObject,
};
