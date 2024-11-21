import { Request, Response } from 'express';

import {
  addPhotoToDB,
  deletePhotosByIdFromDB,
  getPhotoByMediaIdFromDB,
} from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { addServerImagePaths } from '../../modules/diskFilesNaming';
import { addPhotoToDisk, PhotoParsingError } from '../../modules/diskManager';
import { hashFile } from '../../modules/hashing';
import { AddPhoto } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  AddPhoto.ResponseData,
  AddPhoto.ResponseErrorTypes
>();

const callback = async (req: ExtendedRequest, res: Response, body: AddPhoto.RequestData) => {
  if (!req.userId) {
    throw new Error('UserId is not defined.');
  }

  const photoExists = await getPhotoByMediaIdFromDB(body.mediaId, body.deviceUniqueId);

  if (photoExists) {
    req.logger?.debug('Photo exists in db');

    const jsonResponse = {
      photo: responseFormatter.createPhotoObject(photoExists, ''),
      photoExistsBefore: true,
    };

    return sendResponse(req, res, jsonResponse);
  }

  const photo = {
    name: body.name,
    fileSize: body.fileSize,
    width: body.width,
    height: body.height,
    date: body.date,
    syncDate: new Date(Date.now()).toISOString(),
    mediaId: body.mediaId,
    deviceUniqueId: body.deviceUniqueId,
    serverPath: '',
    serverCompressedPath: '',
    serverThumbnailPath: '',
    hash: '',
  };

  await addServerImagePaths(photo);
  photo.hash = hashFile(body.image64);
  req.logger?.debug('Adding photo to db.');

  const dbPhoto = await addPhotoToDB(photo);

  req.logger?.debug('Photo added successfully to db.');
  try {
    req.logger?.debug('Adding photo to disk.');
    await addPhotoToDisk(dbPhoto, body.image64);
  } catch (err) {
    req.logger?.debug('Could not add photo to disk, removing photo from db');
    await deletePhotosByIdFromDB([dbPhoto.id]);

    if (err instanceof PhotoParsingError) {
      req.logger?.error('Format not supported.', err);
      return sendFailedMessage(req, res, `Format not supported`, 'FORMAT_NOT_SUPPORTED');
    }

    throw err;
  }
  req.logger?.debug('Photo added to disk.');
  const jsonResponse = {
    photo: responseFormatter.createPhotoObject(dbPhoto, ''),
    photoExistsBefore: false,
  };

  return sendResponse(req, res, jsonResponse);
};

export default {
  endpoint: AddPhoto.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: AddPhoto.RequestSchema,
} as EndpointType;
