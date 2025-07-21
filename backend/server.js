const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');
const logger = require('./utils/logger.util');

connectDB();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
}); 