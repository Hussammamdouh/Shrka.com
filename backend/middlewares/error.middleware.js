const { AppError } = require('../utils/error.util');
const logger = require('../utils/logger.util');

const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      data: null,
      message: err.message,
      errorCode: err.errorCode || err.code || undefined,
      ...(isDev && { stack: err.stack, origin: err.stack?.split('\n')[1]?.trim() })
    });
  }
  logger.error(err);
  res.status(500).json({
    success: false,
    data: null,
    message: isDev ? (err.message || 'Internal Server Error') : 'Internal Server Error',
    errorCode: 'INTERNAL_SERVER_ERROR',
    ...(isDev && { stack: err.stack, origin: err.stack?.split('\n')[1]?.trim() })
  });
};

module.exports = errorHandler; 