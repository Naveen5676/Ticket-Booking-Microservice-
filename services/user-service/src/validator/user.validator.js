const joi = require("joi");

const registerSchema = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
  phone: joi.string().required(),
  role: joi.string().valid("user", "admin").optional(),
});

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
});


const userProfileUpdateSchema = joi.object({
  name: joi.string().optional(),
  phone: joi.string().optional(),
  role: joi.string().valid("user", "admin").optional(),
})

module.exports = {
  registerSchema,
  loginSchema,
  userProfileUpdateSchema
};
