const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');
const logger = require('./utils/logger.util');
const { startSubscriptionExpiryJob } = require('./services/subscriptionScheduler.service');
require('dotenv-safe').config();

connectDB();
startSubscriptionExpiryJob();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
}); 