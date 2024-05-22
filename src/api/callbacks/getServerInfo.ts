import { Request, Response } from 'express';

import checkConnexionLocal from '../../middleware/checkConnexionLocal';
import checkServerHasValidCredentials from '../../middleware/checkServerHasValidCredentials';
import { GetServerInfo as BackendGetServerInfo } from '../../modules/BackendQueries';
import { GetStorageFolderPath, GetServerName } from '../../modules/serverDataManager';
import { GetServerInfo } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const sendResponse = responseFormatter.getCustomSendResponse<GetServerInfo.ResponseData>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: GetServerInfo.RequestData,
) => {
  try {
    const storageFolderPath = GetStorageFolderPath()
    const serverName = GetServerName();

    const responseJson: {
      storagePath: string;
      serverName: string;
      owner: { name: string; email: string } | null;
    } = {
      storagePath: storageFolderPath,
      serverName: serverName,
      owner: null,
    };

    if (req.hasValidCredentials) {
      const ret = await BackendGetServerInfo.Post();

      if (!ret.ok) {
        throw new Error('Error retrieving server info. ' + JSON.stringify(ret));
      }

      if (ret.data.server.owner != null) {
        const owner = ret.data.server.owner;
        responseJson.owner = {
          name: owner.name,
          email: owner.email,
        };
      }
    }

    return sendResponse(res, responseJson);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: GetServerInfo.endpoint,
  callback: callback,
  method: 'post',
  middleWare: [checkConnexionLocal, checkServerHasValidCredentials],
  requestShema: GetServerInfo.RequestSchema,
} as EndpointType;
