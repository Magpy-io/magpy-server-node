import Joi from "joi";
import { ErrorsAuthorization } from "../ErrorTypes";
import { ServerType, TokenAuthentification } from "../Types";

export type ResponseData = {
  server: ServerType;
};

export const RequestSchema = Joi.object()
  .options({
    presence: "required",
  })
  .meta({ className: "RequestData" });

export type ResponseErrorTypes = ErrorsAuthorization;

export const endpoint = "getServerInfo";

export const tokenAuth: TokenAuthentification = "server";

//auto-generated file using "yarn types"
export * from "../RequestTypes/getServerInfo";
