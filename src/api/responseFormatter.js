// IMPORTS

function sendResponse(res, data, status = 200) {
  let jsonResponse = {
    ok: true,
    data: data,
  };

  return res.status(status).json(jsonResponse);
}

function sendSuccessfulMessage(res, msg, status = 200) {
  let jsonResponse = {
    ok: true,
    message: msg,
  };

  return res.status(status).json(jsonResponse);
}

function sendFailedMessage(
  res,
  msg = "Bad request",
  code = "BAD_REQUEST",
  status = 400
) {
  let jsonResponse = {
    ok: false,
    message: msg,
    code: code,
  };

  return res.status(status).json(jsonResponse);
}

function sendErrorMessage(
  res,
  msg = "Server internal error",
  code = "SERVER_ERROR",
  status = 500
) {
  let jsonResponse = {
    ok: false,
    message: msg,
    code: code,
  };

  return res.status(status).json(jsonResponse);
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
  sendSuccessfulMessage,
  sendFailedMessage,
  sendErrorMessage,
  createPhotoObject,
};
