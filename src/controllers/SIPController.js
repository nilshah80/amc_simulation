const SIP = require('../models/SIP');
const logger = require('../utils/logger');

class SIPController {
  async createSIP(req, res, next) {
    try {
      const sip = await SIP.create(req.body);
      logger.info(`SIP created: ${sip.id} for folio: ${req.body.folioId}`);
      res.status(201).json({
        success: true,
        data: sip
      });
    } catch (error) {
      next(error);
    }
  }

  async getSIP(req, res, next) {
    try {
      const sip = await SIP.findById(req.params.id);
      if (!sip) {
        return res.status(404).json({
          success: false,
          error: 'SIP not found'
        });
      }
      res.json({
        success: true,
        data: sip
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllSIPs(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const { folioId, status, frequency } = req.query;
      
      const filters = {};
      if (folioId) filters.folioId = folioId;
      if (status) filters.status = status;
      if (frequency) filters.frequency = frequency;

      const sips = await SIP.findAll(filters, { page, limit });
      res.json({
        success: true,
        data: sips.sips,
        pagination: {
          page,
          limit,
          total: sips.total,
          pages: Math.ceil(sips.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSIP(req, res, next) {
    try {
      const sip = await SIP.update(req.params.id, req.body);
      if (!sip) {
        return res.status(404).json({
          success: false,
          error: 'SIP not found'
        });
      }
      logger.info(`SIP updated: ${sip.id}`);
      res.json({
        success: true,
        data: sip
      });
    } catch (error) {
      next(error);
    }
  }

  async pauseSIP(req, res, next) {
    try {
      const sip = await SIP.pause(req.params.id);
      if (!sip) {
        return res.status(404).json({
          success: false,
          error: 'SIP not found'
        });
      }
      logger.info(`SIP paused: ${sip.id}`);
      res.json({
        success: true,
        data: sip
      });
    } catch (error) {
      next(error);
    }
  }

  async resumeSIP(req, res, next) {
    try {
      const sip = await SIP.resume(req.params.id);
      if (!sip) {
        return res.status(404).json({
          success: false,
          error: 'SIP not found'
        });
      }
      logger.info(`SIP resumed: ${sip.id}`);
      res.json({
        success: true,
        data: sip
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelSIP(req, res, next) {
    try {
      const sip = await SIP.cancel(req.params.id);
      if (!sip) {
        return res.status(404).json({
          success: false,
          error: 'SIP not found'
        });
      }
      logger.info(`SIP cancelled: ${sip.id}`);
      res.json({
        success: true,
        data: sip
      });
    } catch (error) {
      next(error);
    }
  }

  async getFolioSIPs(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const { status } = req.query;
      
      const filters = { folioId: req.params.folioId };
      if (status) filters.status = status;

      const sips = await SIP.findAll(filters, { page, limit });
      res.json({
        success: true,
        data: sips.sips,
        pagination: {
          page,
          limit,
          total: sips.total,
          pages: Math.ceil(sips.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async executePendingSIPs(req, res, next) {
    try {
      const result = await SIP.executeAllDue();
      logger.info(`SIP execution completed: ${result.executed} executed, ${result.failed} failed`);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getSIPStats(req, res, next) {
    try {
      const stats = await SIP.getStatistics();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SIPController();
