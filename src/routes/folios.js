const express = require('express');
const router = express.Router();
const FolioController = require('../controllers/FolioController');
const { validateFolioCreation, validateUUID, validatePagination } = require('../middleware/validation');

// Create folio
router.post('/', validateFolioCreation, FolioController.createFolio);

// Get all folios with pagination and filters
router.get('/', validatePagination, FolioController.getAllFolios);

// Get folio statistics
router.get('/stats', FolioController.getFolioStats);

// Get customer folios
router.get('/customer/:customerId', validateUUID, validatePagination, FolioController.getCustomerFolios);

// Get single folio
router.get('/:id', validateUUID, FolioController.getFolio);

// Update folio
router.put('/:id', validateUUID, FolioController.updateFolio);

// Get folio holdings
router.get('/:id/holdings', validateUUID, FolioController.getFolioHoldings);

// Get folio transactions
router.get('/:id/transactions', validateUUID, validatePagination, FolioController.getFolioTransactions);

module.exports = router;
