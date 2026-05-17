/**
 * Request ID middleware.
 * Attaches a unique ID to every request for distributed tracing.
 * Respects X-Request-ID header if provided by upstream proxy.
 */
const { v4: uuidv4 } = require('uuid');

const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || uuidv4();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

module.exports = requestId;
