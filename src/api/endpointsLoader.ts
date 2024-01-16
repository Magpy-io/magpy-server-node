import { generateMiddlewareFromShema } from "../middleware/checkValidRequestParameters";
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
const fs = require("mz/fs");

function getEndpoints() {
  const endpoints: any = [];
  fs.readdirSync(__dirname + "/callbacks").forEach(function (file: any) {
    const split = file.split(".");

    //only .js and .ts files
    if (split[split.length - 1] == "ts" || split[split.length - 1] == "js") {
      endpoints.push(require("./callbacks/" + file).default);
    }
  });
  return endpoints;
}

type MiddleWareType = (req: Request, res: Response, next: NextFunction) => {};

type MiddleWareArray = MiddleWareType[];

function loadEndpoints(app: any) {
  const endpoints = getEndpoints();
  endpoints.forEach(
    ({
      endpoint,
      callback,
      method,
      middleWare,
      requestShema,
    }: {
      endpoint: string;
      callback: (
        req: Request,
        res: Response
      ) => Promise<Response<any, Record<string, any>>>;
      method: string;
      middleWare?: MiddleWareType | MiddleWareArray;
      requestShema: Joi.ObjectSchema;
    }) => {
      const reqParamValidationMiddleware =
        generateMiddlewareFromShema(requestShema);

      const callbackWithLogging = (req: Request, res: Response) => {
        console.log(endpoint);
        callback(req, res);
      };
      const endpointFormatted = "/" + endpoint;

      let middleWareArray: MiddleWareArray;

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

      app[method](endpointFormatted, ...middleWareArray, callbackWithLogging);
    }
  );
}

export default loadEndpoints;
