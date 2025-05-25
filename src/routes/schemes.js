const express = require('express');
const router = express.Router();
const SchemeController = require('../controllers/SchemeController');
const { validateUUID, validatePagination } = require('../middleware/validation');

// Create scheme (admin only)
router.post('/', SchemeController.createScheme);

// Get all schemes with pagination and filters
router.get('/', validatePagination, SchemeController.getAllSchemes);

// Search schemes
router.get('/search', validatePagination, SchemeController.searchSchemes);

// Get scheme statistics
router.get('/stats', SchemeController.getSchemeStats);

// Update all NAVs
router.post('/update-navs', SchemeController.updateAllNAVs);

// Get single scheme
router.get('/:id', validateUUID, SchemeController.getScheme);

// Update scheme
router.put('/:id', validateUUID, SchemeController.updateScheme);

// Get scheme current NAV
router.get('/:id/nav', validateUUID, SchemeController.getSchemeNAV);

// Get scheme NAV history
router.get('/:id/nav/history', validateUUID, SchemeController.getSchemeNAVHistory);

// Get scheme performance
router.get('/:id/performance', validateUUID, SchemeController.getSchemePerformance);

module.exports = router;
