import Joi from "joi";

export const RequestSchema = Joi.object({
  path: Joi.string().optional(),
})
  .options({ presence: "required" })
  .meta({ className: "RequestData" });
