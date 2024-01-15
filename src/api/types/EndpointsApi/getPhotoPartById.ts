import Joi from "joi";
import { ErrorServerNotClaimed, ErrorsAuthorization } from "../ErrorTypes";
import { TokenAuthentification } from "../Types";

export type ResponseData = {
  deletedIds: string[];
};

export const RequestSchema = Joi.object({
  id: Joi.string().uuid({
    version: "uuidv4",
  }),
  part: Joi.number().integer(),
})
  .options({ presence: "required" })
  .meta({ className: "RequestData" });

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;

export const endpoint = "getPhotoPartById";

export const tokenAuth: TokenAuthentification = "yes";

//auto-generated file using "yarn types"
export * from "../RequestTypes/getPhotoPartById";
