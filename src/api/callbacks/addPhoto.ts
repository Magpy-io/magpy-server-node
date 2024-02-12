import { Request, Response } from 'express';

import { addPhotoToDB, deletePhotoByIdFromDB } from '../../db/sequelizeDb';
import checkUserToken from '../../middleware/checkUserToken';
import { addServerImagePaths } from '../../modules/diskFilesNaming';
import { addPhotoToDisk } from '../../modules/diskManager';
import { hashFile } from '../../modules/hashing';
import { AddPhoto } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType } from '../endpointsLoader';

const sendResponse = responseFormatter.getCustomSendResponse<AddPhoto.ResponseData>();

const callback = async (req: Request, res: Response, body: AddPhoto.RequestData) => {
  try {
    if (!req.userId) {
      throw new Error('UserId is not defined.');
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
      console.log(dbPhoto);
      await deletePhotoByIdFromDB(dbPhoto.id);
      throw err;
    }
    console.log('Photo added to disk.');
    const jsonResponse = {
      photo: responseFormatter.createPhotoObject(dbPhoto, ''),
    };
    console.log('Sending response message.');
    return sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: AddPhoto.endpoint,
  callback: callback,
  method: 'post',
  middleWare: checkUserToken,
  requestShema: AddPhoto.RequestSchema,
} as EndpointType;
