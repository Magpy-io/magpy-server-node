import { Request, Response, NextFunction } from "express";

import responseFormatter from "@src/api/responseFormatter";

import { combineMiddleware } from "@src/modules/functions";

import checkServerIsClaimed from "@src/middleware/checkServerIsClaimed";

import verifyAuthorizationHeader from "@src/middleware/verifyAuthorizationHeader";

import { verifyUserToken } from "@src/modules/tokenManagement";

async function checkUserToken(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("\n#VerifyServerToken middleware");

    const token = req.token;

    if (!token) {
      throw new Error("Token undefined in checkUserToken");
    }

    if (!req?.serverData?.serverId || !req?.serverData.serverKey) {
      console.log("server is not claimed");
      responseFormatter.sendFailedMessage(
        res,
        "Server not claimed",
        "SERVER_NOT_CLAIMED"
      );
      return;
    }

    const ret = verifyUserToken(token, req.serverData.serverKey);

    if (!ret.ok) {
      if (ret.error == "TOKEN_EXPIRED_ERROR") {
        console.log("User Token expired");
        console.log(ret);
        responseFormatter.sendFailedMessage(
          res,
          "User token expired",
          "AUTHORIZATION_EXPIRED"
        );
        return;
      } else {
        console.log("Invalid user Token");
        console.log(ret);
        responseFormatter.sendFailedMessage(
          res,
          "User token verification failed",
          "AUTHORIZATION_FAILED"
        );
        return;
      }
    }

    req.userId = ret.data.id;
    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
}

export default combineMiddleware([
  checkServerIsClaimed,
  verifyAuthorizationHeader,
  checkUserToken,
]);
