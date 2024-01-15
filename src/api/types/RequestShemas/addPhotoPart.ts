import Joi from "joi";

export const RequestDataShema = Joi.object({
  id: Joi.string().uuid({
    version: "uuidv4",
  }),
  partNumber: Joi.number().integer(),
  partSize: Joi.number().integer(),
  photoPart: Joi.string(),
}).options({ presence: "required" });
