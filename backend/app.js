const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { CORS_ORIGIN } = require('./config/env');
const errorHandler = require('./middlewares/error.middleware');
const logger = require('./utils/logger.util');

const app = express();

app.use(helmet()); // Ensure helmet is first
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/subscription', require('./routes/subscription.routes'));
app.use('/api/join-request', require('./routes/joinRequest.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/company', require('./routes/company.routes'));
// TODO: Add checkCompanySubscription to all business endpoints (company, leads, products, etc.)

app.use(errorHandler);

module.exports = app; 