import { Request, Response } from "express";
const fs = require("mz/fs");

function getEndpoints() {
  const endpoints: any = [];
  fs.readdirSync(__dirname + "/endpoints").forEach(function (file: any) {
    const split = file.split(".");

    //only .js and .ts files
    if (split[split.length - 1] == "ts" || split[split.length - 1] == "js") {
      endpoints.push(require("@src/api/endpoints/" + file).default);
    }
  });
  return endpoints;
}

function loadEndpoints(app: any) {
  const endpoints = getEndpoints();
  endpoints.forEach(
    ({
      endpoint,
      callback,
      method,
      middleWare,
    }: {
      endpoint: string;
      callback: any;
      method: string;
      middleWare: any;
    }) => {
      const callbackWithLogging = (req: Request, res: Response) => {
        console.log(endpoint);
        callback(req, res);
      };
      if (!middleWare) {
        app[method](endpoint, callbackWithLogging);
      } else {
        if (middleWare instanceof Array) {
          app[method](endpoint, ...middleWare, callbackWithLogging);
        } else {
          app[method](endpoint, middleWare, callbackWithLogging);
        }
      }
    }
  );
}

export default loadEndpoints;
