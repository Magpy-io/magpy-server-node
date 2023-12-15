// IMPORTS
import { Response } from "express";
import { Photo } from "@src/types/photoType";

async function sendResponse(res: Response, data: any, status = 200) {
  let jsonResponse = {
    ok: true,
    data: data,
  };

  return await res.status(status).json(jsonResponse);
}

async function sendSuccessfulMessage(res: Response, msg: string, status = 200) {
  let jsonResponse = {
    ok: true,
    message: msg,
  };

  return await res.status(status).json(jsonResponse);
}

async function sendFailedMessage(
  res: Response,
  msg = "Bad request",
  code = "BAD_REQUEST",
  status = 400
) {
  let jsonResponse = {
    ok: false,
    message: msg,
    errorCode: code,
  };

  return await res.status(status).json(jsonResponse);
}

async function sendErrorMessage(res: Response) {
  await sendFailedMessage(res, "Server internal error", "SERVER_ERROR", 500);
}

async function sendErrorBackEndServerUnreachable(res: Response) {
  await sendFailedMessage(
    res,
    "Backend server unreachable",
    "BACKEND_SERVER_UNREACHABLE",
    500
  );
}

function createPhotoObject(dbPhoto: Photo, image64?: string) {
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

export default {
  sendResponse,
  sendSuccessfulMessage,
  sendFailedMessage,
  sendErrorMessage,
  createPhotoObject,
  sendErrorBackEndServerUnreachable,
};
