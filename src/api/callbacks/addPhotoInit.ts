import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

import { postPhotoPartTimeout } from '../../config/config';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { addServerImagePaths } from '../../modules/diskFilesNaming';
import FilesWaiting from '../../modules/waitingFiles';
import { AddPhotoInit, APIPhoto } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';
import { checkPhotoExistsAndDeleteMissing } from '../../modules/functions';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  AddPhotoInit.ResponseData,
  AddPhotoInit.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: AddPhotoInit.RequestData,
) => {
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
      photoExistsBefore: true as true,
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
    syncDate: '',
    mediaId: body.mediaId,
    deviceUniqueId: body.deviceUniqueId,
    serverPath: '',
    serverCompressedPath: '',
    serverThumbnailPath: '',
    hash: '',
  };

  console.log('Photo does not exist in server.');
  console.log('Creating syncDate and photoPath.');
  const image64Len = body.image64Len;
  photo.syncDate = new Date(Date.now()).toISOString();
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
  return sendResponse(res, { id: id, photoExistsBefore: false });
};

export default {
  endpoint: AddPhotoInit.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: AddPhotoInit.RequestSchema,
} as EndpointType;
