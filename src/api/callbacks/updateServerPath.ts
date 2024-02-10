import { Request, Response } from 'express';

import checkConnexionLocal from '../../middleware/checkConnexionLocal';
import { folderHasRights, pathExists } from '../../modules/diskManager';
import { isAbsolutePath } from '../../modules/functions';
import { SaveStorageFolderPath } from '../../modules/serverDataManager';
import { UpdateServerPath } from '../Types';
import responseFormatter from '../responseFormatter';

const sendResponse = responseFormatter.getCustomSendResponse<UpdateServerPath.ResponseData>();

const callback = async (req: Request, res: Response, body: UpdateServerPath.RequestData) => {
  try {
    const { path } = body;

    if (!path) {
      console.log('Nothing to update, sending response');
      return sendResponse(res, 'Nothing to update');
    }

    if (!isAbsolutePath(path)) {
      console.log('Invalid path, not an absolute path');
      return responseFormatter.sendFailedMessage(res, 'Invalid path', 'BAD_REQUEST');
    }

    if (!(await pathExists(path))) {
      console.log('Invalid path, could not access the folder');
      return responseFormatter.sendFailedMessage(
        res,
        'Cannot reach the given path',
        'PATH_FOLDER_DOES_NOT_EXIST',
      );
    }

    if (!(await folderHasRights(path))) {
      console.log('Invalid path, could not access the folder');
      return responseFormatter.sendFailedMessage(
        res,
        'Cannot access the given path',
        'PATH_ACCESS_DENIED',
      );
    }

    await SaveStorageFolderPath(path);

    return sendResponse(res, 'Server path changed');
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: UpdateServerPath.endpoint,
  callback: callback,
  method: 'post',
  middleWare: [checkConnexionLocal],
  requestShema: UpdateServerPath.RequestSchema,
};
