import { Request, Response } from 'express';

import assertLocalOrValidUserToken from '../../middleware/assertLocalOrValidUserToken';
import { folderHasRights, pathExists } from '../../modules/diskBasicFunctions';
import { isAbsolutePath } from '../../modules/functions';
import { SaveStorageFolderPath, GetStorageFolderPath } from '../../modules/serverDataManager';
import { UpdateServerPath } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  UpdateServerPath.ResponseData,
  UpdateServerPath.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: UpdateServerPath.RequestData,
) => {
  try {
    const { path } = body;

    if (!path) {
      console.log('Nothing to update, sending response');
      return sendResponse(res, 'Nothing to update');
    }

    const currentPath = await GetStorageFolderPath();

    if (path == currentPath) {
      console.log('Path is already set, sending response');
      return sendResponse(res, 'Path is already set');
    }

    if (!isAbsolutePath(path)) {
      console.log('Invalid path, not an absolute path');
      return sendFailedMessage(req, res, 'Path is not absolute', 'PATH_NOT_ABSOLUTE');
    }

    if (!(await pathExists(path))) {
      console.log('Invalid path, could not access the folder');
      return sendFailedMessage(
        req,
        res,
        'Cannot reach the given path',
        'PATH_FOLDER_DOES_NOT_EXIST',
      );
    }

    if (!(await folderHasRights(path))) {
      console.log('Invalid path, could not access the folder');
      return sendFailedMessage(req, res, 'Cannot access the given path', 'PATH_ACCESS_DENIED');
    }

    await SaveStorageFolderPath(path);

    return sendResponse(res, 'Server path changed');
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(req, res);
  }
};

export default {
  endpoint: UpdateServerPath.endpoint,
  callback: callback,
  method: 'post',
  middleWare: [assertLocalOrValidUserToken],
  requestShema: UpdateServerPath.RequestSchema,
} as EndpointType;
