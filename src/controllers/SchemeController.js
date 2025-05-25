const Scheme = require('../models/Scheme');
const logger = require('../utils/logger');

class SchemeController {
  async createScheme(req, res, next) {
    try {
      const scheme = await Scheme.create(req.body);
      logger.info(`Scheme created: ${scheme.id}`);
      res.status(201).json({
        success: true,
        data: scheme
      });
    } catch (error) {
      next(error);
    }
  }

  async getScheme(req, res, next) {
    try {
      const scheme = await Scheme.findById(req.params.id);
      if (!scheme) {
        return res.status(404).json({
          success: false,
          error: 'Scheme not found'
        });
      }
      res.json({
        success: true,
        data: scheme
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllSchemes(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const { category, subCategory, amcCode, status } = req.query;
      
      const filters = {};
      if (category) filters.category = category;
      if (subCategory) filters.subCategory = subCategory;
      if (amcCode) filters.amcCode = amcCode;
      if (status) filters.status = status;

      const schemes = await Scheme.findAll(filters, { page, limit });
      res.json({
        success: true,
        data: schemes.schemes,
        pagination: {
          page,
          limit,
          total: schemes.total,
          pages: Math.ceil(schemes.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateScheme(req, res, next) {
    try {
      const scheme = await Scheme.update(req.params.id, req.body);
      if (!scheme) {
        return res.status(404).json({
          success: false,
          error: 'Scheme not found'
        });
      }
      logger.info(`Scheme updated: ${scheme.id}`);
      res.json({
        success: true,
        data: scheme
      });
    } catch (error) {
      next(error);
    }
  }

  async getSchemeNAV(req, res, next) {
    try {
      const nav = await Scheme.getCurrentNAV(req.params.id);
      if (!nav) {
        return res.status(404).json({
          success: false,
          error: 'Scheme not found'
        });
      }
      res.json({
        success: true,
        data: nav
      });
    } catch (error) {
      next(error);
    }
  }

  async getSchemeNAVHistory(req, res, next) {
    try {
      const { period = '1m' } = req.query;
      const history = await Scheme.getNAVHistory(req.params.id, period);
      if (!history || history.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'NAV history not found'
        });
      }
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  async searchSchemes(req, res, next) {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const schemes = await Scheme.search(q, { page, limit });
      res.json({
        success: true,
        data: schemes.schemes,
        pagination: {
          page,
          limit,
          total: schemes.total,
          pages: Math.ceil(schemes.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAllNAVs(req, res, next) {
    try {
      const result = await Scheme.updateAllNAVs();
      logger.info(`NAV update completed for ${result.updated} schemes`);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getSchemeStats(req, res, next) {
    try {
      const stats = await Scheme.getStatistics();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getSchemePerformance(req, res, next) {
    try {
      const { period = '1y' } = req.query;
      const performance = await Scheme.getPerformance(req.params.id, period);
      if (!performance) {
        return res.status(404).json({
          success: false,
          error: 'Scheme not found'
        });
      }
      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SchemeController();
