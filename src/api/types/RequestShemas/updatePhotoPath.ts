import Joi from "joi";

export const RequestSchema = Joi.object({
  id: Joi.string().uuid({ version: "uuidv4" }),
  path: Joi.string(),
  deviceUniqueId: Joi.string().uuid({ version: "uuidv4" }),
})
  .options({ presence: "required" })
  .meta({ className: "RequestData" });
