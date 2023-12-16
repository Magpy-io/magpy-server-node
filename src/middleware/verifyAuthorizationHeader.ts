import { Request, Response, NextFunction } from "express";

import responseFormatter from "@src/api/responseFormatter";

const verifyAuthorizationHeader = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("\n#VerifyAuthorizationHeader middleware");
    const bearerHeader = req.headers["authorization"];

    if (!bearerHeader) {
      console.log("Error : No authorization header");
      responseFormatter.sendFailedMessage(
        res,
        "Invalid authorization",
        "AUTHORIZATION_MISSING",
        401
      );
      return;
    }
    const [prefix, token] = bearerHeader.split(" ");

    if (!prefix || prefix != "Bearer" || !token) {
      console.log("Error : authorization header wrong format");
      responseFormatter.sendFailedMessage(
        res,
        "Invalid authorization",
        "AUTHORIZATION_WRONG_FORMAT",
        401
      );
      return;
    }

    req.token = token;

    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(res);
  }
};

export default verifyAuthorizationHeader;
