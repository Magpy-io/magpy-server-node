import Joi from "joi";
import {
  ErrorInvalidIpAddress,
  ErrorInvalidServerName,
  ErrorsAuthorization,
} from "../ErrorTypes";
import { TokenAuthentification } from "../Types";

export type ResponseData = string;

export const RequestSchema = Joi.object({
  name: Joi.string().optional(),
  ipAddress: Joi.string().optional(),
})
  .options({
    presence: "required",
  })
  .meta({ className: "RequestData" });

export type ResponseErrorTypes =
  | ErrorInvalidIpAddress
  | ErrorInvalidServerName
  | ErrorsAuthorization;

export const endpoint = "updateServerData";

export const tokenAuth: TokenAuthentification = "server";

//auto-generated file using "yarn types"
export * from "../RequestTypes/updateServerData";
