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
  const { path } = body;

  if (!path) {
    req.logger?.debug('Nothing to update, sending response');
    return sendResponse(req, res, 'Nothing to update');
  }

  const currentPath = await GetStorageFolderPath();

  if (path == currentPath) {
    req.logger?.debug('Path is already set, sending response');
    return sendResponse(req, res, 'Path is already set');
  }

  if (!isAbsolutePath(path)) {
    req.logger?.debug('Invalid path, not an absolute path');
    return sendFailedMessage(req, res, 'Path is not absolute', 'PATH_NOT_ABSOLUTE');
  }

  if (!(await pathExists(path))) {
    req.logger?.debug('Invalid path, could not access the folder');
    return sendFailedMessage(
      req,
      res,
      'Cannot reach the given path',
      'PATH_FOLDER_DOES_NOT_EXIST',
    );
  }

  if (!(await folderHasRights(path))) {
    req.logger?.debug('Invalid path, could not access the folder');
    return sendFailedMessage(req, res, 'Cannot access the given path', 'PATH_ACCESS_DENIED');
  }

  await SaveStorageFolderPath(path);

  return sendResponse(req, res, 'Server path changed');
};

export default {
  endpoint: UpdateServerPath.endpoint,
  callback: callback,
  method: 'post',
  middleWare: [assertLocalOrValidUserToken],
  requestShema: UpdateServerPath.RequestSchema,
} as EndpointType;
