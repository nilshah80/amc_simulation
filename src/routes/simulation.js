const express = require('express');
const router = express.Router();
const SimulationController = require('../controllers/SimulationController');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Validation for simulation config
const validateSimulationConfig = [
  body('config.customerCreation.enabled').optional().isBoolean(),
  body('config.customerCreation.intervalSeconds').optional().isInt({ min: 1, max: 3600 }),
  body('config.folioCreation.enabled').optional().isBoolean(),
  body('config.folioCreation.intervalSeconds').optional().isInt({ min: 1, max: 3600 }),
  body('config.transactionCreation.enabled').optional().isBoolean(),
  body('config.transactionCreation.intervalSeconds').optional().isInt({ min: 1, max: 3600 }),
  handleValidationErrors
];

const validateCount = [
  body('count').optional().isInt({ min: 1, max: 1000 }).withMessage('Count must be between 1 and 1000'),
  handleValidationErrors
];

// Get simulation status
router.get('/status', SimulationController.getStatus);

// Get simulation metrics
router.get('/metrics', SimulationController.getMetrics);

// Start simulation
router.post('/start', validateSimulationConfig, SimulationController.startSimulation);

// Stop simulation
router.post('/stop', SimulationController.stopSimulation);

// Pause simulation
router.post('/pause', SimulationController.pauseSimulation);

// Resume simulation
router.post('/resume', SimulationController.resumeSimulation);

// Update simulation configuration
router.put('/config', validateSimulationConfig, SimulationController.updateConfig);

// Manual triggers
router.post('/trigger/customers', validateCount, SimulationController.triggerCustomerCreation);
router.post('/trigger/folios', validateCount, SimulationController.triggerFolioCreation);
router.post('/trigger/transactions', validateCount, SimulationController.triggerTransactionCreation);

// Reset simulation data
router.post('/reset', SimulationController.resetSimulation);

module.exports = router;
