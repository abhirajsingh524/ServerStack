const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain uppercase, lowercase, number, and special character',
    }),
  role: Joi.string().valid('admin', 'researcher').default('researcher'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const createDataSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional().allow(''),
  jsonData: Joi.object().optional(),
  accessLevel: Joi.string().valid('private', 'shared', 'public').default('private'),
  tags: Joi.array().items(Joi.string()).optional(),
});

const updateDataSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  accessLevel: Joi.string().valid('private', 'shared', 'public').optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  createDataSchema,
  updateDataSchema,
};
