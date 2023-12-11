import { Request, Response, NextFunction } from "express";

import responseFormatter from "@src/api/responseFormatter";

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  console.log("Error parsing json body");
  console.log(err);
  console.log("Sending response message");
  responseFormatter.sendFailedMessage(res);
};
