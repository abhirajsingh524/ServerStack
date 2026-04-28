/**
 * Send a standardized success response
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Send a standardized error response
 */
const sendError = (res, statusCode = 500, message = 'Server Error', error = null) => {
  const response = { success: false, message };
  if (error && process.env.NODE_ENV === 'development') response.error = error;
  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
