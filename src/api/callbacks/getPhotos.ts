import { Request, Response } from 'express';

import { getPhotosFromDB } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { getPhotoFromDisk } from '../../modules/diskManager';
import {
  AddWarningPhotosDeleted,
  filterPhotosAndDeleteMissing,
} from '../../modules/functions';
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
  const { photos, endReached } = await getPhotosFromDB(number, offset);

  req.logger?.debug(`Got ${photos?.length} photos.`);

  const ret = await filterPhotosAndDeleteMissing(photos);
  const warning = ret.warning;
  if (warning) {
    AddWarningPhotosDeleted(ret.photosDeleted, req.userId);
  }

  req.logger?.debug(
    `${ret.photosThatExist?.length} photos exist in disk, ${
      photos?.length - ret.photosThatExist?.length
    } photos were missing.`,
  );

  let images64Promises: Promise<string>[] = [];

  if (photoType == 'data') {
    images64Promises = new Array(ret.photosThatExist.length).fill('');
  } else {
    req.logger?.debug(`Retrieving ${photoType} photos from disk.`);
    images64Promises = ret.photosThatExist.map(photo => {
      return getPhotoFromDisk(photo, photoType);
    });
  }

  const images64 = await Promise.all(images64Promises);

  const photosWithImage64 = ret.photosThatExist.map((photo, index) => {
    return responseFormatter.createPhotoObject(photo, images64[index]);
  });

  req.logger?.debug('Photos retrieved from disk if needed.');
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
