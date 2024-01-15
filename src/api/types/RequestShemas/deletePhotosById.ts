import Joi from "joi";

export const RequestDataShema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid({ version: "uuidv4" })),
}).options({ presence: "required" });
