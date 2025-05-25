const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      logger.warn(`Authentication failed: ${err.message}`);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });
};

module.exports = {
  authenticateToken,
  generateToken
};
