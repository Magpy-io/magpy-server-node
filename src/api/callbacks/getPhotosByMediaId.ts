import { Request, Response } from 'express';

import { getPhotosByMediaIdFromDB, Photo } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { getPhotoFromDisk } from '../../modules/diskManager';
import { AddWarningPhotosMissing } from '../../modules/functions';
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
  const photos = await getPhotosByMediaIdFromDB(
    photosData.map(d => d.mediaId),
    deviceUniqueId,
  );
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
    if (!photo)
      return { mediaId: photosData[index].mediaId, exists: false } as {
        mediaId: string;
        exists: false;
      };

    if (images64[index] == null) {
      photosMissing.push(photo);
    }

    const photoWithImage64 = responseFormatter.createPhotoObject(photo, images64[index] || '');
    return {
      mediaId: photosData[index].mediaId,
      exists: true,
      photo: photoWithImage64,
    } as { mediaId: string; exists: true; photo: APIPhoto };
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
  endpoint: GetPhotosByMediaId.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: GetPhotosByMediaId.RequestSchema,
} as EndpointType;
