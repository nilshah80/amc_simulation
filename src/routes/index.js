const express = require('express');
const router = express.Router();

// Import all route modules
const customerRoutes = require('./customers');
const folioRoutes = require('./folios');
const transactionRoutes = require('./transactions');
const sipRoutes = require('./sips');
const schemeRoutes = require('./schemes');
const simulationRoutes = require('./simulation');

// API health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AMC Simulation API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount route modules
router.use('/customers', customerRoutes);
router.use('/folios', folioRoutes);
router.use('/transactions', transactionRoutes);
router.use('/sips', sipRoutes);
router.use('/schemes', schemeRoutes);
router.use('/simulation', simulationRoutes);

module.exports = router;
