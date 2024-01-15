import Joi from "joi";

export const RequestDataShema = Joi.object({
  path: Joi.string().optional(),
}).options({ presence: "required" });
