import { Request, Response } from 'express';

import { getPhotosByMediaId } from '../../db/sequelizeDb';
import checkUserToken from '../../middleware/checkUserToken';
import { getPhotoFromDisk } from '../../modules/diskManager';
import {
  AddWarningPhotosDeleted,
  filterPhotosExistAndDeleteMissing,
} from '../../modules/functions';
import { APIPhoto, GetPhotosByMediaId } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const sendResponse =
  responseFormatter.getCustomSendResponse<GetPhotosByMediaId.ResponseData>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: GetPhotosByMediaId.RequestData,
) => {
  try {
    if (!req.userId) {
      throw new Error('UserId is not defined.');
    }

    const { photosData, photoType, deviceUniqueId } = body;

    console.log('Getting photos from db with mediaId from request.');
    const photos = await getPhotosByMediaId(photosData, deviceUniqueId);
    console.log('Received response from db.');

    const ret = await filterPhotosExistAndDeleteMissing(photos);
    const warning = ret.warning;
    if (warning) {
      AddWarningPhotosDeleted(ret.photosDeleted, req.userId);
    }

    let images64Promises;
    if (photoType == 'data') {
      images64Promises = new Array(ret.photosThatExist.length).fill('');
    } else {
      console.log(`Retrieving ${photoType} photos from disk.`);
      images64Promises = ret.photosThatExist.map(photo => {
        if (!photo) return '';
        return getPhotoFromDisk(photo, photoType);
      });
    }
    const images64 = await Promise.all(images64Promises);

    console.log('Photos retrieved from disk if needed');

    const photosResponse = ret.photosThatExist.map((photo, index) => {
      if (!photo)
        return { mediaId: photosData[index].mediaId, exists: false } as {
          mediaId: string;
          exists: false;
        };

      const photoWithImage64 = responseFormatter.createPhotoObject(photo, images64[index]);
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

    console.log('Sending response data.');
    return sendResponse(res, jsonResponse, warning);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: GetPhotosByMediaId.endpoint,
  callback: callback,
  method: 'post',
  middleWare: checkUserToken,
  requestShema: GetPhotosByMediaId.RequestSchema,
} as EndpointType;
