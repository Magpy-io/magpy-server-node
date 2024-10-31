import { Request, Response } from 'express';

import { IsClaimed } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

import * as BackendQueries from '../../modules/BackendQueries';
import {
  ClearServerCredentials,
  GetServerCredentials,
  IsServerClaimedLocal,
  IsServerClaimedRemote,
} from '../../modules/serverDataManager';
import { ErrorBackendUnreachable } from '../../modules/BackendQueries/ExceptionsManager';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  IsClaimed.ResponseData,
  IsClaimed.ResponseErrorTypes
>();

const callback = async (req: ExtendedRequest, res: Response, body: IsClaimed.RequestData) => {
  if (IsServerClaimedLocal()) {
    return sendResponse(req, res, { claimed: 'Locally' });
  }

  if (IsServerClaimedRemote()) {
    const serverCredentials = GetServerCredentials();

    if (!serverCredentials?.serverId || !serverCredentials?.serverKey) {
      throw new Error('Server is claimed but serverId or serverKey is missing.');
    }

    let ret: BackendQueries.GetServerToken.ResponseType;
    try {
      ret = await BackendQueries.GetServerToken.Post({
        id: serverCredentials.serverId,
        key: serverCredentials.serverKey,
      });
    } catch (err) {
      if (err instanceof ErrorBackendUnreachable) {
        req.logger?.error(
          'Error requesting backend server, could not confirm server claim status.',
        );
        return responseFormatter.sendErrorBackEndServerUnreachable(req, res);
      } else {
        throw err;
      }
    }

    if (ret.ok) {
      return sendResponse(req, res, { claimed: 'Remotely' });
    } else {
      if (ret.errorCode == 'INVALID_CREDENTIALS') {
        req.logger?.debug('invalid server credentials');
        req.logger?.debug('Deleting credentials');
        await ClearServerCredentials();
        return sendResponse(req, res, { claimed: 'None' });
      } else {
        throw new Error('request to verify server credentials failed. ' + JSON.stringify(ret));
      }
    }
  }
  return sendResponse(req, res, { claimed: 'None' });
};

export default {
  endpoint: IsClaimed.endpoint,
  callback: callback,
  method: 'post',
  requestShema: IsClaimed.RequestSchema,
} as EndpointType;
