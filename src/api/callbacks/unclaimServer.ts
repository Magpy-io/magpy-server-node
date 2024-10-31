import { Request, Response } from 'express';

import assertLocalOrValidUserToken from '../../middleware/assertLocalOrValidUserToken';
import checkServerHasValidCredentials from '../../middleware/checkServerHasValidCredentials';
import { DeleteServer } from '../../modules/BackendQueries';
import { ClearServerCredentials } from '../../modules/serverDataManager';
import { UnclaimServer } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  UnclaimServer.ResponseData,
  UnclaimServer.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: UnclaimServer.RequestData,
) => {
  if (req.hasValidCredentials) {
    let ret: DeleteServer.ResponseType | undefined;
    try {
      ret = await DeleteServer.Post();
    } catch (err) {
      console.error('error deleting server from backend');
      console.error(err);
    }

    if (!ret?.ok) {
      console.error('error deleting server from backend');
      console.error(ret);
    } else {
      console.log('Server deleted from backend');
    }
  }

  await ClearServerCredentials();

  return sendResponse(req, res, 'Server unclaimed');
};

export default {
  endpoint: UnclaimServer.endpoint,
  callback: callback,
  method: 'post',
  middleWare: [assertLocalOrValidUserToken, checkServerHasValidCredentials],
  requestShema: UnclaimServer.RequestSchema,
} as EndpointType;
