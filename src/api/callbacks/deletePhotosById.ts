import { Request, Response } from 'express';

import { deletePhotoByIdFromDB, getPhotoByIdFromDB } from '../../db/sequelizeDb';
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

  const removedIds = [];
  for (const id of ids) {
    const dbPhoto = await getPhotoByIdFromDB(id);
    if (dbPhoto) {
      await deletePhotoByIdFromDB(id);
      await removePhotoFromDisk(dbPhoto);
      removedIds.push(id);
    }
  }

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
