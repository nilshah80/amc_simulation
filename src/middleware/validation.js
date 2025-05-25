const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Customer validation rules
const validateCustomerCreation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid Indian mobile number required'),
  body('address').notEmpty().withMessage('Address is required'),
  handleValidationErrors
];

const validateCustomerUpdate = [
  param('id').isUUID().withMessage('Valid customer ID required'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid Indian mobile number required'),
  handleValidationErrors
];

// Folio validation rules
const validateFolioCreation = [
  body('customerId').isUUID().withMessage('Valid customer ID required'),
  body('schemeId').isUUID().withMessage('Valid scheme ID required'),
  handleValidationErrors
];

// Transaction validation rules
const validateTransactionCreation = [
  body('folioId').isUUID().withMessage('Valid folio ID required'),
  body('type').isIn(['PURCHASE', 'REDEMPTION', 'SWITCH_IN', 'SWITCH_OUT', 'SIP', 'STP']).withMessage('Valid transaction type required'),
  body('amount').isFloat({ min: 500 }).withMessage('Minimum amount is ₹500'),
  handleValidationErrors
];

// SIP validation rules
const validateSIPCreation = [
  body('folioId').isUUID().withMessage('Valid folio ID required'),
  body('amount').isFloat({ min: 500 }).withMessage('Minimum SIP amount is ₹500'),
  body('frequency').isIn(['MONTHLY', 'QUARTERLY', 'YEARLY']).withMessage('Valid frequency required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const validateUUID = [
  param('id').isUUID().withMessage('Valid ID required'),
  handleValidationErrors
];

module.exports = {
  validateCustomerCreation,
  validateCustomerUpdate,
  validateFolioCreation,
  validateTransactionCreation,
  validateSIPCreation,
  validatePagination,
  validateUUID,
  handleValidationErrors
};
