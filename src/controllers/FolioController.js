const Folio = require('../models/Folio');
const logger = require('../utils/logger');

class FolioController {
  async createFolio(req, res, next) {
    try {
      const folio = await Folio.create(req.body);
      logger.info(`Folio created: ${folio.id} for customer: ${req.body.customerId}`);
      res.status(201).json({
        success: true,
        data: folio
      });
    } catch (error) {
      next(error);
    }
  }

  async getFolio(req, res, next) {
    try {
      const folio = await Folio.findById(req.params.id);
      if (!folio) {
        return res.status(404).json({
          success: false,
          error: 'Folio not found'
        });
      }
      res.json({
        success: true,
        data: folio
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllFolios(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const { customerId, schemeId, status } = req.query;
      
      const filters = {};
      if (customerId) filters.customerId = customerId;
      if (schemeId) filters.schemeId = schemeId;
      if (status) filters.status = status;

      const folios = await Folio.findAll(filters, { page, limit });
      res.json({
        success: true,
        data: folios.folios,
        pagination: {
          page,
          limit,
          total: folios.total,
          pages: Math.ceil(folios.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFolio(req, res, next) {
    try {
      const folio = await Folio.update(req.params.id, req.body);
      if (!folio) {
        return res.status(404).json({
          success: false,
          error: 'Folio not found'
        });
      }
      logger.info(`Folio updated: ${folio.id}`);
      res.json({
        success: true,
        data: folio
      });
    } catch (error) {
      next(error);
    }
  }

  async getFolioHoldings(req, res, next) {
    try {
      const holdings = await Folio.getHoldings(req.params.id);
      if (!holdings) {
        return res.status(404).json({
          success: false,
          error: 'Folio not found'
        });
      }
      res.json({
        success: true,
        data: holdings
      });
    } catch (error) {
      next(error);
    }
  }

  async getFolioTransactions(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      const transactions = await Folio.getTransactions(req.params.id, { page, limit });
      if (!transactions) {
        return res.status(404).json({
          success: false,
          error: 'Folio not found'
        });
      }
      res.json({
        success: true,
        data: transactions.transactions,
        pagination: {
          page,
          limit,
          total: transactions.total,
          pages: Math.ceil(transactions.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerFolios(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      const folios = await Folio.findByCustomerId(req.params.customerId, { page, limit });
      res.json({
        success: true,
        data: folios.folios,
        pagination: {
          page,
          limit,
          total: folios.total,
          pages: Math.ceil(folios.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getFolioStats(req, res, next) {
    try {
      const stats = await Folio.getStatistics();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FolioController();
