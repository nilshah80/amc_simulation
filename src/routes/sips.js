const express = require('express');
const router = express.Router();
const SIPController = require('../controllers/SIPController');
const { validateSIPCreation, validateUUID, validatePagination } = require('../middleware/validation');

// Create SIP
router.post('/', validateSIPCreation, SIPController.createSIP);

// Get all SIPs with pagination and filters
router.get('/', validatePagination, SIPController.getAllSIPs);

// Get SIP statistics
router.get('/stats', SIPController.getSIPStats);

// Execute all pending SIPs
router.post('/execute', SIPController.executePendingSIPs);

// Get folio SIPs
router.get('/folio/:folioId', validateUUID, validatePagination, SIPController.getFolioSIPs);

// Get single SIP
router.get('/:id', validateUUID, SIPController.getSIP);

// Update SIP
router.put('/:id', validateUUID, SIPController.updateSIP);

// Pause SIP
router.post('/:id/pause', validateUUID, SIPController.pauseSIP);

// Resume SIP
router.post('/:id/resume', validateUUID, SIPController.resumeSIP);

// Cancel SIP
router.post('/:id/cancel', validateUUID, SIPController.cancelSIP);

module.exports = router;
