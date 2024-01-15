import Joi from "joi";

export const RequestDataShema = Joi.object({
  name: Joi.string(),
  fileSize: Joi.number().integer(),
  width: Joi.number().integer(),
  height: Joi.number().integer(),
  path: Joi.string(),
  date: Joi.string().isoDate(),
  image64Len: Joi.number(),
  deviceUniqueId: Joi.string(),
}).options({ presence: "required" });
