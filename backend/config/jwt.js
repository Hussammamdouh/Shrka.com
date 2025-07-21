const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = require('./env');

module.exports = {
  access: {
    secret: JWT_ACCESS_SECRET,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  },
  refresh: {
    secret: JWT_REFRESH_SECRET,
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  },
}; 