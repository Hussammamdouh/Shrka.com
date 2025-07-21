const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');
const logger = require('../utils/logger.util');

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI); // Removed deprecated options
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB; 