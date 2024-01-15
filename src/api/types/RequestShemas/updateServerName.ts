import Joi from "joi";

export const RequestSchema = Joi.object({
  name: Joi.string().optional(),
})
  .options({ presence: "required" })
  .meta({ className: "RequestData" });
