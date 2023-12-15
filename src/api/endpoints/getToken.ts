import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import { getServerInfo, whoAmI } from "@src/modules/backendRequests";

import checkServerHasValidCredentials from "@src/middleware/checkServerHasValidCredentials";

import { GetServerData } from "@src/modules/serverDataManager";

import { generateUserToken } from "@src/modules/tokenManagement";

// getToken : creates and sends a user token that can be used to the the user's photos
const endpoint = "/getToken";
const callback = async (req: Request, res: Response) => {
  console.log("\n[getToken]");

  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  const requestParameters: RequestType = req.body;

  const backendUserToken = requestParameters.userToken;

  try {
    const serverData = await GetServerData();

    if (!req.hasValidCredentials) {
      console.log("server is not claimed");
      responseFormatter.sendFailedMessage(
        res,
        "Server not claimed",
        "SERVER_NOT_CLAIMED"
      );
      return;
    }

    let retUser: any;
    try {
      retUser = await whoAmI(backendUserToken);
    } catch (err) {
      console.error("Error requesting backend server");
      console.error(err);
      responseFormatter.sendErrorBackEndServerUnreachable(res);
      return;
    }

    if (!retUser.ok) {
      if (retUser.errorCode == "AUTHORIZATION_FAILED") {
        console.log("user token authorization error");
        responseFormatter.sendFailedMessage(
          res,
          "User token verification failed",
          "AUTHORIZATION_FAILED",
          401
        );
        return;
      } else {
        console.error("Error requesting backend server");
        console.error(retUser);
        responseFormatter.sendErrorBackEndServerUnreachable(res);
        return;
      }
    }

    let retServer: any;
    try {
      retServer = await getServerInfo(serverData.serverToken);
    } catch (err) {
      console.error("Error requesting backend server");
      console.error(err);
      responseFormatter.sendErrorBackEndServerUnreachable(res);
      return;
    }

    if (!retServer.ok) {
      console.error("request to get server info failed");
      console.error(retServer);
      responseFormatter.sendErrorMessage(res);
      return;
    }

    if (retServer.data.server.owner != retUser.data.user._id) {
      console.log("user not allowed to access this server");
      responseFormatter.sendFailedMessage(
        res,
        "User not allowed to access this server",
        "USER_NOT_ALLOWED"
      );
      return;
    }

    console.log("user has access to server, generating token");

    const userToken = await generateUserToken(retUser.data.user._id);
    res.set("Authorization", "Bearer " + userToken);

    console.log("sending response");
    responseFormatter.sendSuccessfulMessage(
      res,
      "Token generated successfully"
    );
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
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
  middleWare: checkServerHasValidCredentials,
};
