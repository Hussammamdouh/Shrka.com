const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const signAccessToken = (payload) =>
  jwt.sign(payload, jwtConfig.access.secret, { expiresIn: jwtConfig.access.expiresIn });

const signRefreshToken = (payload) =>
  jwt.sign(payload, jwtConfig.refresh.secret, { expiresIn: jwtConfig.refresh.expiresIn });

const verifyAccessToken = (token) =>
  jwt.verify(token, jwtConfig.access.secret);

const verifyRefreshToken = (token) =>
  jwt.verify(token, jwtConfig.refresh.secret);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
}; 