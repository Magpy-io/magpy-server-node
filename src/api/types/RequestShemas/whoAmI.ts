import Joi from "joi";

export const RequestSchema = Joi.object({})
  .options({
    presence: "required",
  })
  .meta({ className: "RequestData" });
