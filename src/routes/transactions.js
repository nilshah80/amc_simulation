const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/TransactionController');
const { validateTransactionCreation, validateUUID, validatePagination } = require('../middleware/validation');

// Create transaction
router.post('/', validateTransactionCreation, TransactionController.createTransaction);

// Get all transactions with pagination and filters
router.get('/', validatePagination, TransactionController.getAllTransactions);

// Get transaction statistics
router.get('/stats', TransactionController.getTransactionStats);

// Get transaction history
router.get('/history', TransactionController.getTransactionHistory);

// Get folio transactions
router.get('/folio/:folioId', validateUUID, validatePagination, TransactionController.getFolioTransactions);

// Get single transaction
router.get('/:id', validateUUID, TransactionController.getTransaction);

// Update transaction
router.put('/:id', validateUUID, TransactionController.updateTransaction);

// Process transaction through CAMS
router.post('/:id/process', validateUUID, TransactionController.processTransaction);

module.exports = router;
