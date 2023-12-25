import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";

import { getServerInfoPost } from "@src/modules/backendImportedQueries";
import checkConnexionLocal from "@src/middleware/checkConnexionLocal";
import checkServerHasValidCredentials from "@src/middleware/checkServerHasValidCredentials";
import { GetServerData } from "@src/modules/serverDataManager";

// getServerInfo : gets information about the server
const endpoint = "/getServerInfo";
const callback = async (req: Request, res: Response) => {
  try {
    const serverDataConfig = await GetServerData();

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
        console.log("Error retrieving server info");
        console.log(ret);
        responseFormatter.sendErrorMessage(res);
        return;
      }

      if (ret.data.server.owner != null) {
        const owner = ret.data.server.owner;
        responseJson.owner = {
          name: owner.name,
          email: owner.email,
        };
      }
    }

    responseFormatter.sendResponse(res, responseJson);
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: [checkConnexionLocal, checkServerHasValidCredentials],
};