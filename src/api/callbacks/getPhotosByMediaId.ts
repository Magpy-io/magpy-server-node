import { Request, Response } from 'express';

import { getPhotosByMediaIdFromDB } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { getPhotoFromDisk } from '../../modules/diskManager';
import {
  AddWarningPhotosMissing,
  filterPhotosExistAndDeleteMissing,
} from '../../modules/functions';
import { APIPhoto, GetPhotosByMediaId } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  GetPhotosByMediaId.ResponseData,
  GetPhotosByMediaId.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: GetPhotosByMediaId.RequestData,
) => {
  if (!req.userId) {
    throw new Error('UserId is not defined.');
  }

  const { photosData, photoType, deviceUniqueId } = body;

  req.logger?.debug('Getting photos from db with mediaId from request.');
  const photos = await getPhotosByMediaIdFromDB(photosData, deviceUniqueId);
  req.logger?.debug('Received response from db.');

  const ret = await filterPhotosExistAndDeleteMissing(photos);
  const warning = ret.warning;
  if (warning) {
    AddWarningPhotosMissing(ret.photosDeleted, req.userId);
  }

  let images64Promises: Promise<string | null>[];

  if (photoType == 'data') {
    images64Promises = new Array(ret.photosThatExist.length).fill('');
  } else {
    req.logger?.debug(`Retrieving ${photoType} photos from disk.`);
    images64Promises = ret.photosThatExist.map(photo => {
      if (!photo) {
        return Promise.resolve('');
      }
      return getPhotoFromDisk(photo, photoType);
    });
  }
  const images64 = await Promise.all(images64Promises);

  req.logger?.debug('Photos retrieved from disk if needed');

  const photosResponse = ret.photosThatExist.map((photo, index) => {
    if (!photo)
      return { mediaId: photosData[index].mediaId, exists: false } as {
        mediaId: string;
        exists: false;
      };

    const photoWithImage64 = responseFormatter.createPhotoObject(photo, images64[index] || '');
    return {
      mediaId: photosData[index].mediaId,
      exists: true,
      photo: photoWithImage64,
    } as { mediaId: string; exists: true; photo: APIPhoto };
  });

  const jsonResponse = {
    number: photosResponse.length,
    photos: photosResponse,
  };

  return sendResponse(req, res, jsonResponse, warning);
};

export default {
  endpoint: GetPhotosByMediaId.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: GetPhotosByMediaId.RequestSchema,
} as EndpointType;
