const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { CORS_ORIGIN } = require('./config/env');
const errorHandler = require('./middlewares/error.middleware');
const logger = require('./utils/logger.util');
const productRoutes = require('./routes/product.routes');
const quotationRoutes = require('./routes/quotation.routes');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimiter = require('./middlewares/rateLimiter.middleware');

const app = express();

app.use(helmet()); // Ensure helmet is first
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(mongoSanitize());
app.use(xss());
app.use(cookieParser());
app.use(morgan('dev', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}

app.use('/api/auth', rateLimiter, require('./routes/auth.routes'));
app.use('/api/subscription', require('./routes/subscription.routes'));
app.use('/api/join-request', require('./routes/joinRequest.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/company', require('./routes/company.routes'));
app.use('/api/funnel', require('./routes/funnel.routes'));
app.use('/api/form', require('./routes/form.routes'));
app.use('/api/lead', require('./routes/lead.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/product', productRoutes);
app.use('/api/quotation', quotationRoutes);
// TODO: Add checkCompanySubscription to all business endpoints (company, leads, products, etc.)

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', uptime: process.uptime() }));

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[METRICS] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

app.use(errorHandler);

module.exports = app; 