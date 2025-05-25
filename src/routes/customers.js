const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/CustomerController');
const { validateCustomerCreation, validateCustomerUpdate, validateUUID, validatePagination } = require('../middleware/validation');

// Create customer
router.post('/', validateCustomerCreation, CustomerController.createCustomer);

// Get all customers with pagination and search
router.get('/', validatePagination, CustomerController.getAllCustomers);

// Search customers
router.get('/search', validatePagination, CustomerController.searchCustomers);

// Get customer statistics
router.get('/stats', CustomerController.getCustomerStats);

// Get single customer
router.get('/:id', validateUUID, CustomerController.getCustomer);

// Update customer
router.put('/:id', validateCustomerUpdate, CustomerController.updateCustomer);

// Delete customer
router.delete('/:id', validateUUID, CustomerController.deleteCustomer);

module.exports = router;
