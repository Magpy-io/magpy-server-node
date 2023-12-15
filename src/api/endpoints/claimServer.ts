import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { checkReqBodyAttributeMissing } from "@src/modules/checkAttibutesMissing";
import { registerServer, getServerToken } from "@src/modules/backendRequests";
import { randomBytes } from "crypto";

import { SaveServerData } from "@src/modules/serverDataManager";

import checkServerHasValidCredentials from "@src/middleware/checkServerHasValidCredentials";

// claimServer : creates server in backend and sets the requesting user as it's owner
const endpoint = "/claimServer";
const callback = async (req: Request, res: Response) => {
  console.log("\n[claimServer]");

  console.log("Checking request parameters.");
  if (checkBodyParamsMissing(req)) {
    console.log("Bad request parameters");
    console.log("Sending response message");
    responseFormatter.sendFailedMessage(res);
    return;
  }
  console.log("Request parameters ok.");

  const requestParameters: RequestType = req.body;

  const { userToken } = requestParameters;

  try {
    if (req.hasValidCredentials) {
      console.log("server already claimed, it has valid token");
      responseFormatter.sendFailedMessage(
        res,
        "Server already claimed",
        "SERVER_ALREADY_CLAIMED"
      );
      return;
    }

    console.log("server not claimed");

    const keyGenerated = randomBytes(32).toString("hex");

    let ret: any;
    try {
      ret = await registerServer(
        userToken,
        keyGenerated,
        "MyServer",
        "0.0.0.0"
      );
    } catch (err) {
      console.error("Error requesting backend server");
      console.error(err);
      responseFormatter.sendErrorBackEndServerUnreachable(res);
      return;
    }

    if (!ret.ok) {
      if (ret.errorCode == "AUTHORIZATION_FAILED") {
        console.log("user token authorization error");
        responseFormatter.sendFailedMessage(
          res,
          "User token verification failed",
          "AUTHORIZATION_FAILED",
          401
        );
        return;
      } else {
        console.error("request to verify user token failed");
        console.error(ret);
        responseFormatter.sendErrorMessage(res);
        return;
      }
    }

    const id = ret.data.server._id;
    console.log("server registered, got id: " + id);

    let ret1: any;
    try {
      ret1 = await getServerToken(id, keyGenerated);
    } catch (err) {
      console.error("Error requesting backend server");
      console.error(err);
      responseFormatter.sendErrorBackEndServerUnreachable(res);
      return;
    }

    if (!ret1.ok) {
      console.error("request to verify server credentials failed");
      console.error(ret);
      responseFormatter.sendErrorMessage(res);
      return;
    }

    console.log("got server token, saving to local");

    const serverToken = ret1.token;

    await SaveServerData({
      serverId: id,
      serverKey: keyGenerated,
      serverToken: serverToken,
    });

    responseFormatter.sendSuccessfulMessage(res, "ok");
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
