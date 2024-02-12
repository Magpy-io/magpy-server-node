import { Request, Response } from 'express';

import checkConnexionLocal from '../../middleware/checkConnexionLocal';
import checkServerHasValidCredentials from '../../middleware/checkServerHasValidCredentials';
import { GetServerInfo as BackendGetServerInfo } from '../../modules/BackendQueries';
import { GetServerConfigData } from '../../modules/serverDataManager';
import { GetServerInfo } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType } from '../endpointsLoader';

const sendResponse = responseFormatter.getCustomSendResponse<GetServerInfo.ResponseData>();

const callback = async (req: Request, res: Response, body: GetServerInfo.RequestData) => {
  try {
    const serverDataConfig = GetServerConfigData();

    const responseJson: {
      storagePath: string;
      serverName: string;
      owner: { name: string; email: string } | null;
    } = {
      storagePath: serverDataConfig.storageFolderPath,
      serverName: serverDataConfig.serverName,
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
