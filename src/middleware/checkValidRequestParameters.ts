import { Request, Response, NextFunction } from "express";
import Joi from "joi";

import responseFormatter from "../api/responseFormatter";

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
