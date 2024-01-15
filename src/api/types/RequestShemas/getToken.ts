import Joi from "joi";

export const RequestDataShema = Joi.object({
  userToken: Joi.string(),
}).options({ presence: "required" });
