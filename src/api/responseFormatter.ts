// IMPORTS
import { Response } from "express";
import { Photo } from "@src/types/photoType";
import { ErrorCodes } from "@src/types/apiErrorCodes";

async function sendResponse(res: Response, data: any) {
  let jsonResponse = {
    ok: true,
    data: data,
    warning: false,
  };

  return await res.status(200).json(jsonResponse);
}

async function sendSuccessfulMessage(res: Response, msg: string) {
  let jsonResponse = {
    ok: true,
    message: msg,
    warning: false,
  };

  return await res.status(200).json(jsonResponse);
}

function formatError(msg: string, code: ErrorCodes) {
  return {
    ok: false,
    message: msg,
    errorCode: code,
  };
}

async function sendFailedMessage(res: Response, msg: string, code: ErrorCodes) {
  let jsonResponse = formatError(msg, code);

  return await res.status(400).json(jsonResponse);
}

async function sendFailedBadRequest(res: Response) {
  let jsonResponse = formatError("Bad request", "BAD_REQUEST");
  return await res.status(400).json(jsonResponse);
}

async function sendErrorMessage(res: Response) {
  let jsonResponse = formatError("Server internal error", "SERVER_ERROR");
  return await res.status(500).json(jsonResponse);
}

async function sendErrorBackEndServerUnreachable(res: Response) {
  let jsonResponse = formatError(
    "Backend server unreachable",
    "BACKEND_SERVER_UNREACHABLE"
  );

  return await res.status(500).json(jsonResponse);
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
  sendFailedBadRequest,
  sendErrorBackEndServerUnreachable,
  sendErrorMessage,
  createPhotoObject,
};
