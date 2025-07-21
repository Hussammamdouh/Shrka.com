const { AppError } = require('../utils/error.util');
const logger = require('../utils/logger.util');

const errorHandler = (err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({ message: err.message });
  }
  logger.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
};

module.exports = errorHandler; 