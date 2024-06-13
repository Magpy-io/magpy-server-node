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

export type MiddleWareType = (req: ExtendedRequest, res: Response, next: NextFunction) => {};

function getEndpoints(): EndpointType[] {
  return Object.values(callbacks).map(callback => callback.default);
}

function loadEndpoints(app: Express) {
  const endpoints = getEndpoints();
  endpoints.forEach(({ endpoint, callback, method, middleWare, requestShema }) => {
    const reqParamValidationMiddleware = generateMiddlewareFromShema(requestShema);
    const callbackFormated = (req: ExtendedRequest, res: Response) => {
      console.log(endpoint);
      callback(req, res, req.body);
    };
    const endpointFormatted = '/' + endpoint;

    let middleWareArray: MiddleWareType[];

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

    app[method](endpointFormatted, ...middleWareArray, callbackFormated);
  });
}

export default loadEndpoints;
