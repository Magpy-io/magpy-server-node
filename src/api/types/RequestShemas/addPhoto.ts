import Joi from "joi";

export const RequestSchema = Joi.object({
  name: Joi.string(),
  fileSize: Joi.number().integer(),
  width: Joi.number().integer(),
  height: Joi.number().integer(),
  path: Joi.string(),
  date: Joi.string().isoDate(),
  image64: Joi.string().base64(),
  deviceUniqueId: Joi.string(),
})
  .options({ presence: "required" })
  .meta({ className: "RequestData" });
