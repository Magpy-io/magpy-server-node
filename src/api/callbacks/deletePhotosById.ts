import { Request, Response } from 'express';

import { deletePhotoByIdFromDB, getPhotoByIdFromDB } from '../../db/sequelizeDb';
import checkUserToken from '../../middleware/checkUserToken';
import { removePhotoFromDisk } from '../../modules/diskManager';
import { DeletePhotosById } from '../Types';
import responseFormatter from '../responseFormatter';

const sendResponse = responseFormatter.getCustomSendResponse<DeletePhotosById.ResponseData>();

const callback = async (req: Request, res: Response, body: DeletePhotosById.RequestData) => {
  try {
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

    console.log('Photos removed from db and disk.');
    console.log('Sending response message.');
    return sendResponse(res, { deletedIds: removedIds });
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: DeletePhotosById.endpoint,
  callback: callback,
  method: 'post',
  middleWare: checkUserToken,
  requestShema: DeletePhotosById.RequestSchema,
};