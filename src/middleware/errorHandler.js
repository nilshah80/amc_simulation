const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error in ${req.method} ${req.path}:`, {
    error: err.message,
    stack: err.stack,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      error: 'Resource already exists',
      message: 'A record with this information already exists'
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'Referenced resource does not exist'
    });
  }

  if (err.code === '23514') { // Check constraint violation
    return res.status(400).json({
      error: 'Invalid data',
      message: 'Data does not meet requirements'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid token'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
