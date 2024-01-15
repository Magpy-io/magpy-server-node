import Joi from "joi";

export const RequestSchema = Joi.object({
  userToken: Joi.string(),
})
  .options({ presence: "required" })
  .meta({ className: "RequestData" });
