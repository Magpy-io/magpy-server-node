import Joi from "joi";
import { PhotoTypesArray } from "../Types";

export const RequestSchema = Joi.object({
  photosData: Joi.array().items(
    Joi.object({
      path: Joi.string(),
      date: Joi.string().isoDate(),
      size: Joi.number().integer(),
    }).options({ presence: "required" })
  ),
  photoType: Joi.string().valid(...PhotoTypesArray),
  deviceUniqueId: Joi.string().uuid({ version: "uuidv4" }),
})
  .options({ presence: "required" })
  .meta({ className: "RequestData" });
