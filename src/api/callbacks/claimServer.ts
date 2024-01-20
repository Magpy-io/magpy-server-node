import { randomBytes } from 'crypto';
import { Request, Response } from 'express';

import checkServerIsClaimed from '../../middleware/checkServerIsClaimed';
import { GetServerToken, RegisterServer, TokenManager } from '../../modules/BackendQueries';
import { ErrorBackendUnreachable } from '../../modules/BackendQueries/ExceptionsManager';
import { getMyPort, getMyPrivateIp, getMyPublicIp } from '../../modules/NetworkManager';
import { GetServerName, SaveServerCredentials } from '../../modules/serverDataManager';
import { ClaimServer } from '../Types';
import responseFormatter from '../responseFormatter';

const sendResponse = responseFormatter.getCustomSendResponse<ClaimServer.ResponseData>();

const callback = async (req: Request, res: Response, body: ClaimServer.RequestData) => {
  try {
    const myIpPublic = await getMyPublicIp();
    const myIpPrivate = await getMyPrivateIp();
    const myPort = await getMyPort();

    const { userToken } = body;

    if (req.isClaimed) {
      console.log('server already claimed, it has valid token');
      return responseFormatter.sendFailedMessage(
        res,
        'Server already claimed',
        'SERVER_ALREADY_CLAIMED',
      );
    }

    console.log('server not claimed');

    const keyGenerated = randomBytes(32).toString('hex');

    let ret: RegisterServer.ResponseType;
    try {
      TokenManager.SetUserToken(userToken);
      ret = await RegisterServer.Post({
        name: GetServerName(),
        ipAddressPublic: myIpPublic,
        ipAddressPrivate: myIpPrivate,
        port: myPort,
        serverKey: keyGenerated,
      });
    } catch (err) {
      if (err instanceof ErrorBackendUnreachable) {
        console.error('Error requesting backend server');
        return responseFormatter.sendErrorBackEndServerUnreachable(res);
      } else {
        throw err;
      }
    }

    if (!ret.ok) {
      if (ret.errorCode == 'AUTHORIZATION_FAILED') {
        console.log('user token authorization error');
        return responseFormatter.sendFailedMessage(
          res,
          'User token verification failed',
          'AUTHORIZATION_BACKEND_FAILED',
        );
      } else if (ret.errorCode == 'AUTHORIZATION_EXPIRED') {
        console.log('user token expired');
        return responseFormatter.sendFailedMessage(
          res,
          'User token expired',
          'AUTHORIZATION_BACKEND_EXPIRED',
        );
      } else {
        throw new Error('request to verify user token failed. ' + JSON.stringify(ret));
      }
    }

    const id = ret.data.server._id;
    console.log('server registered, got id: ' + id);

    let ret1: GetServerToken.ResponseType;
    try {
      ret1 = await GetServerToken.Post({ id: id, key: keyGenerated });
    } catch (err) {
      if (err instanceof ErrorBackendUnreachable) {
        console.error('Error requesting backend server');
        return responseFormatter.sendErrorBackEndServerUnreachable(res);
      } else {
        throw err;
      }
    }

    if (!ret1.ok) {
      throw new Error('request to verify server credentials failed. ' + JSON.stringify(ret1));
    }

    console.log('got server token, saving to local');

    const serverToken = TokenManager.GetServerToken();

    await SaveServerCredentials({
      serverId: id,
      serverKey: keyGenerated,
      serverToken: serverToken,
    });

    return sendResponse(res, 'ok');
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: ClaimServer.endpoint,
  callback: callback,
  method: 'post',
  middleWare: checkServerIsClaimed,
  requestShema: ClaimServer.RequestSchema,
};
