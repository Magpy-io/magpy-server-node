import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";

import { getServerInfoPost } from "@src/modules/backendImportedQueries";
import checkConnexionLocal from "@src/middleware/checkConnexionLocal";
import checkServerHasValidCredentials from "@src/middleware/checkServerHasValidCredentials";
import { GetServerConfigData } from "@src/modules/serverDataManager";

// getServerInfo : gets information about the server
const endpoint = "/getServerInfo";
const callback = async (req: Request, res: Response) => {
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
      const ret = await getServerInfoPost();

      if (!ret.ok) {
        console.error("Error retrieving server info");
        console.error(ret);
        return responseFormatter.sendErrorMessage(res);
      }

      if (ret.data.server.owner != null) {
        const owner = ret.data.server.owner;
        responseJson.owner = {
          name: owner.name,
          email: owner.email,
        };
      }
    }

    return responseFormatter.sendResponse(res, responseJson);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: [checkConnexionLocal, checkServerHasValidCredentials],
};
