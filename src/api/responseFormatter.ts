// IMPORTS
import { Response } from "express";
import { Photo } from "@src/db/sequelizeDb";
import { APIPhoto } from "@src/api/export/exportedTypes/Types";
import { ErrorCodes } from "@src/api/export/exportedTypes/ErrorTypes";

function getCustomSendResponse<T>() {
  // get the type of the data parameter of type T

  return async function (res: Response, data: T, warning: boolean = false) {
    if (typeof data == "string") {
      return await sendSuccessfulMessage(res, data, warning);
    } else {
      return await sendResponse<T>(res, data, warning);
    }
  };
}

async function sendResponse<T>(
  res: Response,
  data: T,
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

async function sendFailedBadRequest(res: Response, message: string) {
  let jsonResponse = formatError(message, "BAD_REQUEST", false);
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
      date: dbPhoto.date.toJSON(),
      syncDate: dbPhoto.syncDate.toJSON(),
      serverPath: dbPhoto.serverPath,
      clientPaths: dbPhoto.clientPaths,
    },
    image64: image64 ? image64 : "",
  };
}

export default {
  getCustomSendResponse,
  sendFailedMessage,
  sendFailedBadRequest,
  sendErrorBackEndServerUnreachable,
  sendErrorMessage,
  createPhotoObject,
};
