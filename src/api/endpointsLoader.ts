import { NextFunction, Response, Express } from 'express';
import Joi from 'joi';
import * as callbacks from './callbacks';
import { generateMiddlewareFromShema } from '../middleware/checkValidRequestParameters';
import { ExtendedRequest } from '../types/express/ExtendedRequest';

export type { ExtendedRequest };

export type EndpointType = {
  endpoint: string;
  callback: (
    req: ExtendedRequest,
    res: Response,
    body: any,
  ) => Promise<Response<any, Record<string, any>>>;
  method: 'post';
  middleWare?: MiddleWareType | MiddleWareType[];
  requestShema: Joi.ObjectSchema;
};

export type MiddleWareType = (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) => Promise<Response<any, Record<string, any>> | void>;

function getEndpoints(): EndpointType[] {
  return Object.values(callbacks).map(callback => callback.default);
}

function loadEndpoints(app: Express) {
  const endpoints = getEndpoints();
  endpoints.forEach(({ endpoint, callback, method, middleWare, requestShema }) => {
    const reqParamValidationMiddleware = generateMiddlewareFromShema(requestShema);
    const callbackCatched = (req: ExtendedRequest, res: Response, next: NextFunction) => {
      callback(req, res, req.body).catch(next);
    };
    const endpointFormatted = '/' + endpoint;

    let middleWareArray: MiddleWareType[];

    function convertMiddelware(middelware: MiddleWareType) {
      return (req: ExtendedRequest, res: Response, next: NextFunction) => {
        return middelware(req, res, next).catch(next);
      };
    }

    if (middleWare) {
      if (middleWare instanceof Array) {
        middleWareArray = middleWare;
      } else {
        middleWareArray = [middleWare];
      }
    } else {
      middleWareArray = [];
    }

    // execute parameter validation just before endpoint callback
    middleWareArray.push(reqParamValidationMiddleware);

    const middlewareArrayCatched = middleWareArray.map(convertMiddelware);

    app[method](endpointFormatted, ...middlewareArrayCatched, callbackCatched);
  });
}

export default loadEndpoints;
