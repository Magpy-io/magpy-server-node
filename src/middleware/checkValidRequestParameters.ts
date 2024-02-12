import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

import responseFormatter from '../api/responseFormatter';
import { ExtendedRequest } from '../api/endpointsLoader';

function generateMiddlewareFromShema(shema: Joi.ObjectSchema) {
  return async function checkValidRequestParameters(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      console.log('#checkValidRequestParameters middleware');

      const { error } = shema.validate(req.body);
      if (error) {
        console.log('Bad request parameters');
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
