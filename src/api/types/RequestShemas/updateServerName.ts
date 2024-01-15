import Joi from "joi";

export const RequestDataShema = Joi.object({
  name: Joi.string().optional(),
}).options({ presence: "required" });
