import { Request, Response } from 'express';

import { deletePhotosByIdFromDB, getPhotosByIdFromDB } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { removePhotoFromDisk } from '../../modules/diskManager';
import { DeletePhotosById } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  DeletePhotosById.ResponseData,
  DeletePhotosById.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: DeletePhotosById.RequestData,
) => {
  const ids: string[] = body.ids;

  const photosDb = await getPhotosByIdFromDB(ids);

  await deletePhotosByIdFromDB(ids);

  const deletePhotosFromDiskPromises = photosDb.map(dbPhoto => {
    if (dbPhoto != null) {
      return removePhotoFromDisk(dbPhoto);
    }
  });

  await Promise.all(deletePhotosFromDiskPromises);

  const removedIds = photosDb
    .map(photoDb => {
      return photoDb?.id;
    })
    .filter(id => {
      return id != null;
    });

  req.logger?.debug('Photos removed from db and disk.');

  return sendResponse(req, res, { deletedIds: removedIds });
};

export default {
  endpoint: DeletePhotosById.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: DeletePhotosById.RequestSchema,
} as EndpointType;
