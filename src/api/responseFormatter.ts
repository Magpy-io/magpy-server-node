// IMPORTS
import { Response } from 'express';

import { Photo } from '../db/sequelizeDb';
import { APIPhoto } from './Types';
import { ResponseTypeFrom } from './Types/ApiGlobalTypes';
import { ErrorCodes } from './Types/ErrorTypes';

function getCustomSendResponse<T, E extends ErrorCodes | null>() {
  const sendResponseCustom = async function (
    res: Response,
    data: T,
    warning: boolean = false,
  ) {
    return await sendResponse(res, data, warning);
  };

  const sendFailedMessageCustom = async function (
    res: Response,
    msg: string,
    code: E,
    warning: boolean = false,
  ) {
    return await sendFailedMessage(res, msg, code, warning);
  };

  return { sendResponse: sendResponseCustom, sendFailedMessage: sendFailedMessageCustom };
}

async function sendResponse<T>(res: Response, data: T, warning: boolean = false) {
  let jsonResponse: ResponseTypeFrom<T, any> = {
    ok: true,
    data,
    warning,
  };

  return await res.status(200).json(jsonResponse);
}

function formatError(
  msg: string,
  code: ErrorCodes,
  warning: boolean = false,
): ResponseTypeFrom<any, ErrorCodes> {
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
  code: ErrorCodes | null,
  warning: boolean = false,
) {
  let jsonResponse = formatError(msg, code ?? 'SERVER_ERROR', warning);

  return await res.status(400).json(jsonResponse);
}

async function sendFailedBadRequest(res: Response, message: string) {
  let jsonResponse = formatError(message, 'BAD_REQUEST', false);
  return await res.status(400).json(jsonResponse);
}

async function sendErrorMessage(res: Response) {
  let jsonResponse = formatError('Server internal error', 'SERVER_ERROR', false);
  return await res.status(500).json(jsonResponse);
}

async function sendErrorBackEndServerUnreachable(res: Response) {
  let jsonResponse = formatError(
    'Backend server unreachable',
    'BACKEND_SERVER_UNREACHABLE',
    false,
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
      date: dbPhoto.date.toISOString(),
      syncDate: dbPhoto.syncDate.toISOString(),
      serverPath: dbPhoto.serverPath,
      mediaIds: dbPhoto.mediaIds,
    },
    image64: image64 ? image64 : '',
  };
}

export default {
  getCustomSendResponse,
  sendFailedBadRequest,
  sendErrorBackEndServerUnreachable,
  sendErrorMessage,
  createPhotoObject,
  sendFailedMessageMiddleware: sendFailedMessage,
};
