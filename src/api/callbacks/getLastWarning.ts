import { Request, Response } from 'express';

import checkUserToken from '../../middleware/checkUserToken';
import { GetLastWarningForUser } from '../../modules/warningsManager';
import { GetLastWarning } from '../Types';
import responseFormatter from '../responseFormatter';

const sendResponse = responseFormatter.getCustomSendResponse<GetLastWarning.ResponseData>();

const callback = async (req: Request, res: Response, body: GetLastWarning.RequestData) => {
  try {
    if (!req.userId) {
      throw new Error('UserId is not defined.');
    }

    const userId = req.userId;

    const warning = GetLastWarningForUser(userId);

    const jsonResponse = {
      warning: warning ? warning : null,
    };
    console.log('Warning found, sending response');
    return sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: GetLastWarning.endpoint,
  callback: callback,
  method: 'post',
  middleWare: checkUserToken,
  requestShema: GetLastWarning.RequestSchema,
};
