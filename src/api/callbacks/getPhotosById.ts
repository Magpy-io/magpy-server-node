import { Request, Response } from 'express';

import { getPhotosByIdFromDB, Photo } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { getPhotoFromDisk } from '../../modules/diskManager';
import { AddWarningPhotosMissing } from '../../modules/functions';
import { APIPhoto, GetPhotosById } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  GetPhotosById.ResponseData,
  GetPhotosById.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: GetPhotosById.RequestData,
) => {
  if (!req.userId) {
    throw new Error('UserId is not defined.');
  }

  const { ids, photoType } = body;

  req.logger?.debug(`Getting ${ids.length} photos from db.`);
  const photos = await getPhotosByIdFromDB(ids);
  req.logger?.debug('Received response from db.');

  let images64: (string | null)[] = new Array(photos.length).fill('');

  if (photoType != 'data') {
    req.logger?.debug(`Retrieving ${photoType} photos from disk.`);

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      if (photo) {
        images64[i] = await getPhotoFromDisk(photo, photoType);
      }
    }
  }

  req.logger?.debug('Photos retrieved from disk if needed');

  const photosMissing: Photo[] = [];

  const photosResponse = photos.map((photo, index) => {
    if (!photo) {
      return { id: ids[index], exists: false } as {
        id: string;
        exists: false;
      };
    }

    if (images64[index] == null) {
      photosMissing.push(photo);
    }

    const photoWithImage64 = responseFormatter.createPhotoObject(photo, images64[index] || '');
    return { id: ids[index], exists: true, photo: photoWithImage64 } as {
      id: string;
      exists: true;
      photo: APIPhoto;
    };
  });

  const warning = photosMissing.length != 0;
  if (warning) {
    AddWarningPhotosMissing(photosMissing, req.userId);
  }

  const jsonResponse = {
    number: photosResponse.length,
    photos: photosResponse,
  };

  return sendResponse(req, res, jsonResponse, warning);
};

export default {
  endpoint: GetPhotosById.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: GetPhotosById.RequestSchema,
} as EndpointType;
