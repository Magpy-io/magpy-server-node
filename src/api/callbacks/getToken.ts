import { Request, Response } from "express";
import responseFormatter from "../responseFormatter";

import {
  GetServerInfo,
  WhoAmI,
  TokenManager,
} from "../../modules/BackendQueries";
import { ErrorBackendUnreachable } from "../../modules/BackendQueries/ExceptionsManager";
import checkServerIsClaimed from "../../middleware/checkServerIsClaimed";

import { GetServerConfigData } from "../../modules/serverDataManager";

import { generateUserToken } from "../../modules/tokenManagement";

import { GetToken } from "../Types";

const sendResponse =
  responseFormatter.getCustomSendResponse<GetToken.ResponseData>();

const callback = async (
  req: Request,
  res: Response,
  body: GetToken.RequestData
) => {
  try {
    const backendUserToken = body.userToken;

    const serverData = GetServerConfigData();

    if (!req.isClaimed) {
      console.log("server is not claimed");
      return responseFormatter.sendFailedMessage(
        res,
        "Server not claimed",
        "SERVER_NOT_CLAIMED"
      );
    }

    let retUser: WhoAmI.ResponseType;
    try {
      TokenManager.SetUserToken(backendUserToken);
      retUser = await WhoAmI.Post();
    } catch (err) {
      if (err instanceof ErrorBackendUnreachable) {
        console.error("Error requesting backend server");
        return responseFormatter.sendErrorBackEndServerUnreachable(res);
      } else {
        throw err;
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

    let retServer: GetServerInfo.ResponseType;
    try {
      TokenManager.SetServerToken(serverData.serverToken);
      retServer = await GetServerInfo.Post();
    } catch (err) {
      if (err instanceof ErrorBackendUnreachable) {
        console.error("Error requesting backend server");
        return responseFormatter.sendErrorBackEndServerUnreachable(res);
      } else {
        throw err;
      }
    }

    if (!retServer.ok) {
      throw new Error(
        "request to get server info failed. " + JSON.stringify(retServer)
      );
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

    const userToken = generateUserToken(retUser.data.user._id);
    res.set("Authorization", "Bearer " + userToken);

    console.log("sending response");
    return sendResponse(res, "Token generated successfully");
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: GetToken.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkServerIsClaimed,
  requestShema: GetToken.RequestSchema,
};
