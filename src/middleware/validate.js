const { sendError } = require('../utils/response');

/**
 * Joi validation middleware factory
 * @param {Object} schema - Joi schema
 * @param {string} source - 'body' | 'query' | 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[source], { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      return sendError(res, 422, messages);
    }
    next();
  };
};

module.exports = validate;
