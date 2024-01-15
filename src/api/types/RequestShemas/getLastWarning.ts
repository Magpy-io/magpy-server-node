import Joi from "joi";

export const RequestDataShema = Joi.object({}).options({
  presence: "required",
});
