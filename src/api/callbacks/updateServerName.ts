import { Request, Response } from 'express';

import assertConnexionLocal from '../../middleware/connexionLocal/assertConnexionLocal';
import checkServerHasValidCredentials from '../../middleware/checkServerHasValidCredentials';
import { UpdateServerData } from '../../modules/BackendQueries';
import { SaveServerName } from '../../modules/serverDataManager';
import { UpdateServerName } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const sendResponse = responseFormatter.getCustomSendResponse<UpdateServerName.ResponseData>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: UpdateServerName.RequestData,
) => {
  try {
    const { name } = body;

    if (!name) {
      console.log('Nothing to update, sending response');
      return sendResponse(res, 'Nothing to update');
    }

    if (name.length < 3 || name.length > 70) {
      console.log('Invalid name');
      return responseFormatter.sendFailedMessage(
        res,
        'Name too short or too long',
        'INVALID_NAME',
      );
    }

    if (!/^[a-zA-Z0-9 \-_]+$/.test(name)) {
      console.log('Invalid name');
      return responseFormatter.sendFailedMessage(
        res,
        'Name can only contain alphanumeric characters, whitespaces, -, and _',
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
    return sendResponse(res, 'Server name changed');
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: UpdateServerName.endpoint,
  callback: callback,
  method: 'post',
  middleWare: [assertConnexionLocal, checkServerHasValidCredentials],
  requestShema: UpdateServerName.RequestSchema,
} as EndpointType;
