import Joi from "joi";
import { PhotoTypesArray } from "../Types";

export const RequestSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid({ version: "uuidv4" })),
  photoType: Joi.string().valid(...PhotoTypesArray),
})
  .options({ presence: "required" })
  .meta({ className: "RequestData" });
