import Joi from "joi";

export const RequestSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid({ version: "uuidv4" })),
})
  .options({ presence: "required" })
  .meta({ className: "RequestData" });
