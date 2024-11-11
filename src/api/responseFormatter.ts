// IMPORTS
import { Response } from 'express';

import { Photo } from '../db/sequelizeDb';
import { APIPhoto } from './Types';
import { ResponseTypeFrom } from './Types/ApiGlobalTypes';
import { ErrorCodes } from './Types/ErrorTypes';
import { ExtendedRequest } from './endpointsLoader';

function getCustomSendResponse<T, E extends ErrorCodes | null>() {
  const sendResponseCustom = async function (
    req: ExtendedRequest,
    res: Response,
    data: T,
    warning: boolean = false,
  ) {
    return await sendResponse(req, res, data, warning);
  };

  const sendFailedMessageCustom = async function (
    req: ExtendedRequest,
    res: Response,
    msg: string,
    code: E,
    warning: boolean = false,
  ) {
    return await sendFailedMessage(req, res, msg, code, warning);
  };

  return { sendResponse: sendResponseCustom, sendFailedMessage: sendFailedMessageCustom };
}

async function sendResponse<T>(
  req: ExtendedRequest,
  res: Response,
  data: T,
  warning: boolean = false,
) {
  let jsonResponse: ResponseTypeFrom<T, any> = {
    ok: true,
    data,
    warning,
  };

  req.logger?.http('Sending response', {
    ok: true,
    type: 'response',
    code: 200,
  });

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
  req: ExtendedRequest,
  res: Response,
  msg: string,
  code: ErrorCodes | null,
  warning: boolean = false,
) {
  let jsonResponse = formatError(msg, code ?? 'SERVER_ERROR', warning);

  req.logger?.http('Sending response', {
    ok: false,
    type: 'response',
    code: 400,
    errorCode: code ?? 'SERVER_ERROR',
  });

  return await res.status(400).json(jsonResponse);
}

async function sendFailedBadRequest(req: ExtendedRequest, res: Response, message: string) {
  let jsonResponse = formatError(message, 'BAD_REQUEST', false);

  req.logger?.http('Sending response', {
    ok: false,
    type: 'response',
    code: 400,
    errorCode: 'BAD_REQUEST',
  });

  return await res.status(400).json(jsonResponse);
}

async function sendErrorMessage(req: ExtendedRequest, res: Response) {
  let jsonResponse = formatError('Server internal error', 'SERVER_ERROR', false);

  req.logger?.http('Sending response', {
    ok: false,
    type: 'response',
    code: 500,
    errorCode: 'SERVER_ERROR',
  });

  return await res.status(500).json(jsonResponse);
}

async function sendErrorBackEndServerUnreachable(req: ExtendedRequest, res: Response) {
  let jsonResponse = formatError(
    'Backend server unreachable',
    'BACKEND_SERVER_UNREACHABLE',
    false,
  );

  req.logger?.http('Sending response', {
    ok: false,
    type: 'response',
    code: 500,
    errorCode: 'BACKEND_SERVER_UNREACHABLE',
  });

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
