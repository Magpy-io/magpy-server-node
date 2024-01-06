// IMPORTS
import { Response } from "express";
import { Photo } from "@src/types/photoType";
import { APIPhoto } from "@src/api/export/exportedTypes";
import { ErrorCodes } from "@src/types/apiErrorCodes";

async function sendResponse(
  res: Response,
  data: any,
  warning: boolean = false
) {
  let jsonResponse = {
    ok: true,
    data,
    warning,
  };

  return await res.status(200).json(jsonResponse);
}

async function sendSuccessfulMessage(
  res: Response,
  message: string,
  warning: boolean = false
) {
  let jsonResponse = {
    ok: true,
    message,
    warning,
  };

  return await res.status(200).json(jsonResponse);
}

function formatError(msg: string, code: ErrorCodes, warning: boolean = false) {
  return {
    ok: false,
    message: msg,
    errorCode: code,
    warning,
  };
}

async function sendFailedMessage(
  res: Response,
  msg: string,
  code: ErrorCodes,
  warning: boolean = false
) {
  let jsonResponse = formatError(msg, code, warning);

  return await res.status(400).json(jsonResponse);
}

async function sendFailedBadRequest(res: Response) {
  let jsonResponse = formatError("Bad request", "BAD_REQUEST", false);
  return await res.status(400).json(jsonResponse);
}

async function sendErrorMessage(res: Response) {
  let jsonResponse = formatError(
    "Server internal error",
    "SERVER_ERROR",
    false
  );
  return await res.status(500).json(jsonResponse);
}

async function sendErrorBackEndServerUnreachable(res: Response) {
  let jsonResponse = formatError(
    "Backend server unreachable",
    "BACKEND_SERVER_UNREACHABLE",
    false
  );

  return await res.status(500).json(jsonResponse);
}

function createPhotoObject(dbPhoto: Photo, image64?: string): APIPhoto {
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
    image64: image64 ? image64 : "",
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
