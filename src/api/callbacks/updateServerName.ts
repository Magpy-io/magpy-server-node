import { Request, Response } from 'express';

import assertLocalOrValidUserToken from '../../middleware/assertLocalOrValidUserToken';
import checkServerHasValidCredentials from '../../middleware/checkServerHasValidCredentials';
import { UpdateServerData } from '../../modules/BackendQueries';
import { SaveServerName } from '../../modules/serverDataManager';
import { UpdateServerName } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  UpdateServerName.ResponseData,
  UpdateServerName.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: UpdateServerName.RequestData,
) => {
  const { name } = body;

  if (!name) {
    req.logger?.debug('Nothing to update, sending response');
    return sendResponse(req, res, 'Nothing to update');
  }

  if (name.length < 3 || name.length > 70) {
    req.logger?.debug('Invalid name');
    return sendFailedMessage(req, res, 'Name too short or too long', 'INVALID_NAME');
  }

  if (!/^[a-zA-Z0-9 \-_'\$\*=\+\,;\.\?/:!&]+$/.test(name)) {
    req.logger?.debug('Invalid name');
    return sendFailedMessage(
      req,
      res,
      "Name can only contain alphanumeric characters, whitespaces, and any of [-_'$*+=,;./:!&]",
      'INVALID_NAME',
    );
  }

  await SaveServerName(name);

  if (req.hasValidCredentials) {
    const ret = await UpdateServerData.Post({ name: name });

    if (!ret.ok) {
      throw new Error('Error saving server name. ' + JSON.stringify(ret));
    }
  }
  return sendResponse(req, res, 'Server name changed');
};

export default {
  endpoint: UpdateServerName.endpoint,
  callback: callback,
  method: 'post',
  middleWare: [assertLocalOrValidUserToken, checkServerHasValidCredentials],
  requestShema: UpdateServerName.RequestSchema,
} as EndpointType;
