import { Request, Response } from 'express';

import { getPhotosFromDB, Photo } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { getPhotoFromDisk } from '../../modules/diskManager';
import { AddWarningPhotosMissing } from '../../modules/functions';
import { GetPhotos } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  GetPhotos.ResponseData,
  GetPhotos.ResponseErrorTypes
>();

const callback = async (req: ExtendedRequest, res: Response, body: GetPhotos.RequestData) => {
  if (!req.userId) {
    throw new Error('UserId is not defined.');
  }

  const { number, offset, photoType } = body;

  req.logger?.debug(`Getting ${number} photos with offset ${offset} from db.`);

  const profiler = req.logger?.startTimer();
  const { photos, endReached } = await getPhotosFromDB(number, offset);
  profiler?.done({ message: 'Getting photos from db', level: 'info' });

  req.logger?.debug(`Got ${photos?.length} photos.`);

  let images64Promises: Promise<string | null>[];

  if (photoType == 'data') {
    images64Promises = new Array(photos.length).fill('');
  } else {
    req.logger?.debug(`Retrieving ${photoType} photos from disk.`);
    images64Promises = photos.map(photo => {
      return getPhotoFromDisk(photo, photoType);
    });
  }

  const images64 = await Promise.all(images64Promises);
  req.logger?.debug('Photos retrieved from disk if needed.');

  const photosMissing: Photo[] = [];

  const photosWithImage64 = photos.map((photo, index) => {
    if (images64[index] == null) {
      photosMissing.push(photo);
    }
    return responseFormatter.createPhotoObject(photo, images64[index] || '');
  });

  const warning = photosMissing.length != 0;
  if (warning) {
    AddWarningPhotosMissing(photosMissing, req.userId);
  }

  const jsonResponse = {
    endReached: endReached,
    number: photosWithImage64.length,
    photos: photosWithImage64,
  };

  return sendResponse(req, res, jsonResponse, warning);
};

export default {
  endpoint: GetPhotos.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: GetPhotos.RequestSchema,
} as EndpointType;
