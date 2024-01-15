import { Request, Response, NextFunction } from "express";

import responseFormatter from "@src/api/responseFormatter";

import { GetServerConfigData } from "@src/modules/serverDataManager";
import Joi from "joi";

function generateMiddlewareFromShema(shema: Joi.ObjectSchema) {
  return async function checkValidRequestParameters(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      console.log("#checkValidRequestParameters middleware");

      const { error } = shema.validate(req.body);
      if (error) {
        console.log("Bad request parameters");
        return responseFormatter.sendFailedBadRequest(res, error.message);
      }

      next();
    } catch (err) {
      console.error(err);
      responseFormatter.sendErrorMessage(res);
    }
  };
}

export { generateMiddlewareFromShema };
