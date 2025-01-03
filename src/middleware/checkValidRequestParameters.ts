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
    req.logger?.middleware('checkValidRequestParameters');
    const { error } = shema.validate(req.body);
    if (error) {
      req.logger?.debug('Bad request parameters: ' + error.message);
      return responseFormatter.sendFailedBadRequest(req, res, error.message);
    }

    next();
  };
}

export { generateMiddlewareFromShema };
