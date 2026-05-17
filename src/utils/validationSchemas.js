const Joi = require('joi');

// ── Auth ──────────────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required(),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)',
    }),
  role: Joi.string().valid('admin', 'researcher').default('researcher'),
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().required(),
  password: Joi.string().max(128).required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// ── Data ──────────────────────────────────────────────────────────────────
const createDataSchema = Joi.object({
  title: Joi.string().min(1).max(200).trim().required(),
  description: Joi.string().max(1000).trim().optional().allow(''),
  // jsonData validated as object (parsed before this runs for multipart)
  jsonData: Joi.alternatives().try(Joi.object(), Joi.string()).optional(),
  accessLevel: Joi.string().valid('private', 'shared', 'public').default('private'),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().max(50)).max(20),
    Joi.string() // comma-separated from form
  ).optional(),
});

const updateDataSchema = Joi.object({
  title: Joi.string().min(1).max(200).trim().optional(),
  description: Joi.string().max(1000).trim().optional().allow(''),
  accessLevel: Joi.string().valid('private', 'shared', 'public').optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
}).min(1); // at least one field required

// ── Query Params ──────────────────────────────────────────────────────────
const dataQuerySchema = Joi.object({
  page:        Joi.number().integer().min(1).default(1),
  limit:       Joi.number().integer().min(1).max(100).default(20),
  tag:         Joi.string().trim().optional(),
  accessLevel: Joi.string().valid('private', 'shared', 'public').optional(),
});

const logQuerySchema = Joi.object({
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(50),
  action: Joi.string().valid(
    'LOGIN_SUCCESS', 'LOGIN_FAILED', 'REGISTER',
    'DATA_CREATE', 'DATA_READ', 'DATA_UPDATE', 'DATA_DELETE',
    'UNAUTHORIZED_ACCESS'
  ).optional(),
  userId: Joi.string().hex().length(24).optional(), // valid ObjectId
});

// ── Admin ─────────────────────────────────────────────────────────────────
const objectIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid ID format',
    'string.hex':    'Invalid ID format',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  createDataSchema,
  updateDataSchema,
  dataQuerySchema,
  logQuerySchema,
  objectIdSchema,
};
