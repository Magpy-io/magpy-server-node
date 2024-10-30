import { Request, Response } from 'express';

import {
  addPhotoToDB,
  deletePhotoByIdFromDB,
  checkPhotoExistsByMediaIdInDB,
} from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { addServerImagePaths } from '../../modules/diskFilesNaming';
import { addPhotoToDisk, PhotoParsingError } from '../../modules/diskManager';
import { hashFile } from '../../modules/hashing';
import { AddPhoto } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';
import { checkPhotoExistsAndDeleteMissing } from '../../modules/functions';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  AddPhoto.ResponseData,
  AddPhoto.ResponseErrorTypes
>();

const callback = async (req: ExtendedRequest, res: Response, body: AddPhoto.RequestData) => {
  try {
    if (!req.userId) {
      throw new Error('UserId is not defined.');
    }

    const photoExists = await checkPhotoExistsAndDeleteMissing({
      mediaId: body.mediaId,
      deviceUniqueId: body.deviceUniqueId,
    });

    if (photoExists.exists) {
      console.log('Photo exists in db');

      const jsonResponse = {
        photo: responseFormatter.createPhotoObject(photoExists.exists, ''),
        photoExistsBefore: true,
      };

      console.log('Sending response message.');
      return sendResponse(res, jsonResponse);
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
    console.log('Adding photo to db.');

    const dbPhoto = await addPhotoToDB(photo);

    console.log('Photo added successfully to db.');
    try {
      console.log('Adding photo to disk.');
      await addPhotoToDisk(dbPhoto, body.image64);
    } catch (err) {
      console.log('Could not add photo to disk, removing photo from db');
      await deletePhotoByIdFromDB(dbPhoto.id);

      if (err instanceof PhotoParsingError) {
        console.log('Format not supported.');
        console.log(err);
        return sendFailedMessage(req, res, `Format not supported`, 'FORMAT_NOT_SUPPORTED');
      }

      throw err;
    }
    console.log('Photo added to disk.');
    const jsonResponse = {
      photo: responseFormatter.createPhotoObject(dbPhoto, ''),
      photoExistsBefore: false,
    };
    console.log('Sending response message.');
    return sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(req, res);
  }
};

export default {
  endpoint: AddPhoto.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: AddPhoto.RequestSchema,
} as EndpointType;
