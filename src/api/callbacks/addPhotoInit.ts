import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

import { postPhotoPartTimeout } from '../../config/config';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { addServerImagePaths } from '../../modules/diskFilesNaming';
import FilesWaiting from '../../modules/waitingFiles';
import { AddPhotoInit } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';
import { getPhotoByMediaIdFromDB } from '../../db/sequelizeDb';

const { sendResponse } = responseFormatter.getCustomSendResponse<
  AddPhotoInit.ResponseData,
  AddPhotoInit.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: AddPhotoInit.RequestData,
) => {
  if (!req.userId) {
    throw new Error('UserId is not defined.');
  }

  const photoExists = await getPhotoByMediaIdFromDB(
    { mediaId: body.mediaId },
    body.deviceUniqueId,
  );

  if (photoExists) {
    req.logger?.debug('Photo exists in db');

    const jsonResponse = {
      photo: responseFormatter.createPhotoObject(photoExists, ''),
      photoExistsBefore: true as true,
    };

    return sendResponse(req, res, jsonResponse);
  }

  const photo = {
    name: body.name,
    fileSize: body.fileSize,
    width: body.width,
    height: body.height,
    date: body.date,
    syncDate: '',
    mediaId: body.mediaId,
    deviceUniqueId: body.deviceUniqueId,
    serverPath: '',
    serverCompressedPath: '',
    serverThumbnailPath: '',
    hash: '',
  };

  req.logger?.debug('Photo does not exist in server.');
  req.logger?.debug('Creating syncDate and photoPath.');
  const image64Len = body.image64Len;
  photo.syncDate = new Date(Date.now()).toISOString();
  await addServerImagePaths(photo);
  const id = uuid();

  FilesWaiting.set(id, {
    received: 0,
    image64Len: image64Len,
    dataParts: new Map<number, string>(),
    timeout: setTimeout(() => {
      req.logger?.debug(`Photo transfer for id ${id} timed out.`);
      req.logger?.debug(`Deleting pending transfer for id ${id}`);
      FilesWaiting.delete(id);
    }, postPhotoPartTimeout),
    photo: photo,
  });
  return sendResponse(req, res, { id: id, photoExistsBefore: false });
};

export default {
  endpoint: AddPhotoInit.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: AddPhotoInit.RequestSchema,
} as EndpointType;
