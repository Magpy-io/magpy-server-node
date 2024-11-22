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

  let firstError: any = null;

  for (const dbPhoto of photosDb) {
    if (dbPhoto != null) {
      try {
        await removePhotoFromDisk(dbPhoto);
      } catch (e) {
        if (firstError == null) {
          firstError = e;
        }
      }
    }
  }

  if (firstError) {
    throw firstError;
  }

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
