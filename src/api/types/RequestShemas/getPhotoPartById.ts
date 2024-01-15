import Joi from "joi";

export const RequestDataShema = Joi.object({
  id: Joi.string().uuid({
    version: "uuidv4",
  }),
  part: Joi.number().integer(),
}).options({ presence: "required" });
