import Joi from "joi";

export const RequestSchema = Joi.object({
  id: Joi.string().uuid({
    version: "uuidv4",
  }),
  part: Joi.number().integer(),
})
  .options({ presence: "required" })
  .meta({ className: "RequestData" });
