import { Request, Response } from 'express';

import checkServerIsClaimedRemote from '../../middleware/checkServerIsClaimedRemote';
import { GetServerInfo, TokenManager, WhoAmI } from '../../modules/BackendQueries';
import { ErrorBackendUnreachable } from '../../modules/BackendQueries/ExceptionsManager';
import {
  GetServerCredentials,
  GetServerSigningKey,
  GetServerToken,
  SaveServerSigningKey,
} from '../../modules/serverDataManager';
import { generateUserToken } from '../../modules/tokenManagement';
import { GetToken } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';
import { randomBytes } from 'crypto';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  GetToken.ResponseData,
  GetToken.ResponseErrorTypes
>();

const callback = async (req: ExtendedRequest, res: Response, body: GetToken.RequestData) => {
  const backendUserToken = body.userToken;

  if (!req.isClaimedRemote) {
    req.logger?.debug('server is not claimed');
    return sendFailedMessage(req, res, 'Server not claimed', 'SERVER_NOT_CLAIMED');
  }

  let retUser: WhoAmI.ResponseType;
  try {
    TokenManager.SetUserToken(backendUserToken);
    retUser = await WhoAmI.Post();
  } catch (err) {
    if (err instanceof ErrorBackendUnreachable) {
      req.logger?.error('Error requesting backend server');
      return responseFormatter.sendErrorBackEndServerUnreachable(req, res);
    } else {
      throw err;
    }
  }

  if (!retUser.ok) {
    if (retUser.errorCode == 'AUTHORIZATION_FAILED') {
      req.logger?.debug('user token authorization error');
      return sendFailedMessage(
        req,
        res,
        'User token verification failed',
        'AUTHORIZATION_BACKEND_FAILED',
      );
    } else if (retUser.errorCode == 'AUTHORIZATION_EXPIRED') {
      req.logger?.debug('user token expired');
      return sendFailedMessage(
        req,
        res,
        'User token expired',
        'AUTHORIZATION_BACKEND_EXPIRED',
      );
    } else {
      req.logger?.error('Error requesting backend server', { ret: retUser });
      return responseFormatter.sendErrorBackEndServerUnreachable(req, res);
    }
  }

  const serverToken = GetServerToken();

  if (!serverToken) {
    throw new Error('Should have server token');
  }

  let retServer: GetServerInfo.ResponseType;
  try {
    TokenManager.SetServerToken(serverToken);
    retServer = await GetServerInfo.Post();
  } catch (err) {
    if (err instanceof ErrorBackendUnreachable) {
      req.logger?.error('Error requesting backend server');
      return responseFormatter.sendErrorBackEndServerUnreachable(req, res);
    } else {
      throw err;
    }
  }

  if (!retServer.ok) {
    throw new Error('request to get server info failed. ' + JSON.stringify(retServer));
  }

  if (retServer.data.server.owner?._id != retUser.data.user._id) {
    req.logger?.debug('user not allowed to access this server');
    return sendFailedMessage(
      req,
      res,
      'User not allowed to access this server',
      'USER_NOT_ALLOWED',
    );
  }

  req.logger?.debug('user has access to server, generating token');

  let serverSigningKey = GetServerSigningKey();

  if (!serverSigningKey) {
    req.logger?.debug(
      'First time generating token, generating signing key and saving it to server config.',
    );
    const keyGenerated = randomBytes(32).toString('hex');
    serverSigningKey = keyGenerated;
    await SaveServerSigningKey(keyGenerated);
  }

  const userToken = generateUserToken(retUser.data.user._id, serverSigningKey);
  res.set('x-authorization', 'Bearer ' + userToken);

  return sendResponse(req, res, 'Token generated successfully');
};

export default {
  endpoint: GetToken.endpoint,
  callback: callback,
  method: 'post',
  middleWare: checkServerIsClaimedRemote,
  requestShema: GetToken.RequestSchema,
} as EndpointType;
