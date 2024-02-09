import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

import { postPhotoPartTimeout } from '../../config/config';
import checkUserToken from '../../middleware/checkUserToken';
import { addServerImagePaths } from '../../modules/diskFilesNaming';
import FilesWaiting from '../../modules/waitingFiles';
import { AddPhotoInit } from '../Types';
import responseFormatter from '../responseFormatter';

const sendResponse = responseFormatter.getCustomSendResponse<AddPhotoInit.ResponseData>();

const callback = async (req: Request, res: Response, body: AddPhotoInit.RequestData) => {
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
      syncDate: '',
      mediaId: body.path,
      deviceUniqueId: body.deviceUniqueId,
      serverPath: '',
      serverCompressedPath: '',
      serverThumbnailPath: '',
      hash: '',
    };

    console.log('Photo does not exist in server.');
    console.log('Creating syncDate and photoPath.');
    const image64Len = body.image64Len;
    photo.syncDate = new Date(Date.now()).toJSON();
    await addServerImagePaths(photo);
    const id = uuid();

    FilesWaiting.set(id, {
      received: 0,
      image64Len: image64Len,
      dataParts: new Map<number, string>(),
      timeout: setTimeout(() => {
        console.log(`Photo transfer for id ${id} timed out.`);
        console.log(`Deleting pending transfer for id ${id}`);
        FilesWaiting.delete(id);
      }, postPhotoPartTimeout),
      photo: photo,
    });
    console.log('Sending response message.');
    return sendResponse(res, { id: id });
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: AddPhotoInit.endpoint,
  callback: callback,
  method: 'post',
  middleWare: checkUserToken,
  requestShema: AddPhotoInit.RequestSchema,
};
