require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

// Import services for initialization
const SimulationService = require('./services/SimulationService');
const ScheduledJobs = require('./jobs/ScheduledJobs');
const Scheme = require('./models/Scheme');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Indian Mutual Fund AMC Simulation',
    version: '1.0.0',
    description: 'Comprehensive simulation of Indian Mutual Fund operations with CAMS integration',
    endpoints: {
      health: '/api/health',
      customers: '/api/customers',
      folios: '/api/folios',
      transactions: '/api/transactions',
      sips: '/api/sips',
      schemes: '/api/schemes',
      simulation: '/api/simulation'
    },
    documentation: 'https://github.com/your-repo/amc-simulation'
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop simulation
    await SimulationService.stop();
    
    // Stop scheduled jobs
    ScheduledJobs.stopAll();
    
    // Close database connections
    const db = require('./config/database');
    await db.end();
    
    // Close Redis connection
    const redis = require('./config/redis');
    await redis.disconnect();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Initialize application
async function initialize() {
  try {
    logger.info('Initializing AMC Simulation...');
    
    // Test database connection
    const db = require('./config/database');
    await db.query('SELECT NOW()');
    logger.info('Database connection established');
    
    // Test Redis connection
    const redis = require('./config/redis');
    await redis.ping();
    logger.info('Redis connection established');
    
    // Load initial scheme data
    logger.info('Loading initial scheme data...');
    await Scheme.loadInitialData();
    logger.info('Initial scheme data loaded');
    
    // Start scheduled jobs
    logger.info('Starting scheduled jobs...');
    ScheduledJobs.start();
    logger.info('Scheduled jobs started');
    
    // Auto-start simulation if configured
    if (config.simulation.autoStart) {
      logger.info('Auto-starting simulation...');
      await SimulationService.start();
      logger.info('Simulation auto-started');
    }
    
    logger.info('AMC Simulation initialized successfully');
    
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start server
const PORT = config.app.port;
const server = app.listen(PORT, async () => {
  logger.info(`AMC Simulation server started on port ${PORT}`);
  logger.info(`Environment: ${config.app.env}`);
  logger.info(`API Documentation: http://localhost:${PORT}/api/health`);
  
  // Initialize after server starts
  await initialize();
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      logger.error(`Port ${PORT} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = app;
