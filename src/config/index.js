require('dotenv').config();

module.exports = {
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'amc_simulation',
    user: process.env.DB_USER || 'amc_user',
    password: process.env.DB_PASSWORD || 'amc_password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },

  // Application configuration
  app: {
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Simulation configuration
  simulation: {
    customerCreationInterval: parseInt(process.env.CUSTOMER_CREATION_INTERVAL) || 5000,
    folioCreationInterval: parseInt(process.env.FOLIO_CREATION_INTERVAL) || 3600000,
    maxFoliosPerCustomer: parseInt(process.env.MAX_FOLIOS_PER_CUSTOMER) || 100,
    transactionSimulationInterval: parseInt(process.env.TRANSACTION_SIMULATION_INTERVAL) || 30000,
    camsProcessingDelay: parseInt(process.env.CAMS_PROCESSING_DELAY) || 300000,
    navUpdateInterval: parseInt(process.env.NAV_UPDATE_INTERVAL) || 86400000,
  },

  // AMC configuration
  amc: {
    code: process.env.AMC_CODE || 'SIMAMC',
    name: process.env.AMC_NAME || 'Simulation AMC',
  },

  // Transaction types
  transactionTypes: {
    PURCHASE: 'PURCHASE',
    REDEMPTION: 'REDEMPTION',
    SWITCH_IN: 'SWITCH_IN',
    SWITCH_OUT: 'SWITCH_OUT',
    DIVIDEND: 'DIVIDEND',
  },

  // Transaction modes
  transactionModes: {
    SIP: 'SIP',
    LUMPSUM: 'LUMPSUM',
    STP: 'STP',
    SWP: 'SWP',
    REDEMPTION: 'REDEMPTION',
    DIVIDEND: 'DIVIDEND',
  },

  // Status types
  statuses: {
    transaction: {
      SUBMITTED: 'SUBMITTED',
      PROCESSED: 'PROCESSED',
      REJECTED: 'REJECTED',
      CANCELLED: 'CANCELLED',
    },
    cams: {
      PENDING: 'PENDING',
      PROCESSED: 'PROCESSED',
      REJECTED: 'REJECTED',
      FAILED: 'FAILED',
    },
    customer: {
      KYC_PENDING: 'PENDING',
      KYC_COMPLETED: 'COMPLETED',
      KYC_REJECTED: 'REJECTED',
    },
    folio: {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE',
      CLOSED: 'CLOSED',
    },
    sip: {
      ACTIVE: 'ACTIVE',
      PAUSED: 'PAUSED',
      CANCELLED: 'CANCELLED',
      COMPLETED: 'COMPLETED',
    },
  },
};
