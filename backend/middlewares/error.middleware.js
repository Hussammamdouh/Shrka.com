const { AppError } = require('../utils/error.util');
const logger = require('../utils/logger.util');

const errorHandler = (err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      data: null,
      message: err.message,
      errorCode: err.errorCode || err.code || undefined
    });
  }
  logger.error(err);
  res.status(500).json({
    success: false,
    data: null,
    message: 'Internal Server Error',
    errorCode: 'INTERNAL_SERVER_ERROR'
  });
};

module.exports = errorHandler; 