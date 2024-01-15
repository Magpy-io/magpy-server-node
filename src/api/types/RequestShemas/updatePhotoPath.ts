import Joi from "joi";

export const RequestDataShema = Joi.object({
  id: Joi.string().uuid({ version: "uuidv4" }),
  path: Joi.string(),
  deviceUniqueId: Joi.string().uuid({ version: "uuidv4" }),
}).options({ presence: "required" });
