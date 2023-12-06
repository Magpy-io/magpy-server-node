import { Request } from "express";

export function checkParamMissing(body: any, param: string, type: string) {
  if (type === "Array") return !(body[param] instanceof Array);

  if (type == "Array string") {
    if (!(body[param] instanceof Array)) return true;

    return body[param].some((e: any) => !(typeof e === "string"));
  }

  if (type == "Array number") {
    if (!(body[param] instanceof Array)) return true;

    return body[param].some((e: any) => !(typeof e === "number"));
  }

  if (type === "Date")
    return !(typeof body[param] === "string") || isNaN(Date.parse(body[param]));

  if (type === "number" || type === "string")
    return !(typeof body[param] === type);

  throw "checkParamMissing: invalid parameter 'type'";
}

export function checkReqBodyAttributeMissing(
  req: Request,
  param: string,
  type: string
) {
  return checkParamMissing(req.body, param, type);
}
