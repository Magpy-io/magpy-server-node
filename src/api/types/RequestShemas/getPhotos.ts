import Joi from "joi";
import { PhotoTypesArray } from "../Types";

export const RequestSchema = Joi.object({
  number: Joi.number().integer(),
  offset: Joi.number().integer(),
  photoType: Joi.string().valid(...PhotoTypesArray),
})
  .options({ presence: "required" })
  .meta({ className: "RequestData" });
