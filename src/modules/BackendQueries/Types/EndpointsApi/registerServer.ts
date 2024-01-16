import Joi from "joi";
import {
  ErrorInvalidIpAddress,
  ErrorInvalidKeyFormat,
  ErrorInvalidServerName,
  ErrorsAuthorization,
} from "../ErrorTypes";
import { ServerType, TokenAuthentification } from "../Types";

export type ResponseData = {
  server: ServerType;
};

export const RequestSchema = Joi.object({
  name: Joi.string(),
  ipAddress: Joi.string(),
  serverKey: Joi.string(),
})
  .options({
    presence: "required",
  })
  .meta({ className: "RequestData" });

export type ResponseErrorTypes =
  | ErrorInvalidIpAddress
  | ErrorInvalidServerName
  | ErrorInvalidKeyFormat
  | ErrorsAuthorization;

export const endpoint = "registerServer";

export const tokenAuth: TokenAuthentification = "user";

//auto-generated file using "yarn types"
export * from "../RequestTypes/registerServer";
