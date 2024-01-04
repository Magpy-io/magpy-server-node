import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import {
  getServerInfoPost,
  GetServerInfoResponseType,
  whoAmIPost,
  WhoAmIResponseType,
  SetUserToken,
  SetServerToken,
  ErrorBackendUnreachable,
} from "@src/modules/backendImportedQueries";

import checkServerIsClaimed from "@src/middleware/checkServerIsClaimed";

import { GetServerData } from "@src/modules/serverDataManager";

import { generateUserToken } from "@src/modules/tokenManagement";

// getToken : creates and sends a user token that can be used to the the user's photos
const endpoint = "/getToken";
const callback = async (req: Request, res: Response) => {
  try {
    console.log("Checking request parameters.");
    if (checkBodyParamsMissing(req)) {
      console.log("Bad request parameters");
      console.log("Sending response message");
      return responseFormatter.sendFailedMessage(res);
    }
    console.log("Request parameters ok.");

    const requestParameters: RequestType = req.body;

    const backendUserToken = requestParameters.userToken;

    const serverData = await GetServerData();

    if (!req.isClaimed) {
      console.log("server is not claimed");
      return responseFormatter.sendFailedMessage(
        res,
        "Server not claimed",
        "SERVER_NOT_CLAIMED"
      );
    }

    let retUser: WhoAmIResponseType;
    try {
      SetUserToken(backendUserToken);
      retUser = await whoAmIPost();
    } catch (err) {
      if (err instanceof ErrorBackendUnreachable) {
        console.log("Error requesting backend server");
        return responseFormatter.sendErrorBackEndServerUnreachable(res);
      } else {
        console.error(err);
        return responseFormatter.sendErrorMessage(res);
      }
    }

    if (!retUser.ok) {
      if (retUser.errorCode == "AUTHORIZATION_FAILED") {
        console.log("user token authorization error");
        return responseFormatter.sendFailedMessage(
          res,
          "User token verification failed",
          "AUTHORIZATION_BACKEND_FAILED"
        );
      } else if (retUser.errorCode == "AUTHORIZATION_EXPIRED") {
        console.log("user token expired");
        return responseFormatter.sendFailedMessage(
          res,
          "User token expired",
          "AUTHORIZATION_BACKEND_EXPIRED"
        );
      } else {
        console.error("Error requesting backend server");
        console.error(retUser);
        return responseFormatter.sendErrorBackEndServerUnreachable(res);
      }
    }

    if (!serverData.serverToken) {
      throw new Error("Should have server token");
    }

    let retServer: GetServerInfoResponseType;
    try {
      SetServerToken(serverData.serverToken);
      retServer = await getServerInfoPost();
    } catch (err) {
      if (err instanceof ErrorBackendUnreachable) {
        console.log("Error requesting backend server");
        return responseFormatter.sendErrorBackEndServerUnreachable(res);
      } else {
        console.error(err);
        return responseFormatter.sendErrorMessage(res);
      }
    }

    if (!retServer.ok) {
      console.error("request to get server info failed");
      console.error(retServer);
      return responseFormatter.sendErrorMessage(res);
    }

    if (retServer.data.server.owner?._id != retUser.data.user._id) {
      console.log("user not allowed to access this server");
      return responseFormatter.sendFailedMessage(
        res,
        "User not allowed to access this server",
        "USER_NOT_ALLOWED"
      );
    }

    console.log("user has access to server, generating token");

    const userToken = await generateUserToken(retUser.data.user._id);
    res.set("Authorization", "Bearer " + userToken);

    console.log("sending response");
    return responseFormatter.sendSuccessfulMessage(
      res,
      "Token generated successfully"
    );
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

function checkBodyParamsMissing(req: Request) {
  if (checkReqBodyAttributeMissing(req, "userToken", "string")) return true;

  return false;
}

type RequestType = {
  userToken: string;
};

export default {
  endpoint: endpoint,
  callback: callback,
  method: "post",
  middleWare: checkServerIsClaimed,
};
