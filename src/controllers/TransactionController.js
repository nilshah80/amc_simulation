const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

class TransactionController {
  async createTransaction(req, res, next) {
    try {
      const transaction = await Transaction.create(req.body);
      logger.info(`Transaction created: ${transaction.id} for folio: ${req.body.folioId}`);
      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransaction(req, res, next) {
    try {
      const transaction = await Transaction.findById(req.params.id);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllTransactions(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const { folioId, type, status, startDate, endDate } = req.query;
      
      const filters = {};
      if (folioId) filters.folioId = folioId;
      if (type) filters.type = type;
      if (status) filters.status = status;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const transactions = await Transaction.findAll(filters, { page, limit });
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

  async updateTransaction(req, res, next) {
    try {
      const transaction = await Transaction.update(req.params.id, req.body);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }
      logger.info(`Transaction updated: ${transaction.id}`);
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }

  async processTransaction(req, res, next) {
    try {
      const transaction = await Transaction.processCAMSTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }
      logger.info(`Transaction processed: ${transaction.id} - Status: ${transaction.status}`);
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }

  async getFolioTransactions(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const { type, status } = req.query;
      
      const filters = { folioId: req.params.folioId };
      if (type) filters.type = type;
      if (status) filters.status = status;

      const transactions = await Transaction.findAll(filters, { page, limit });
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

  async getTransactionStats(req, res, next) {
    try {
      const stats = await Transaction.getStatistics();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactionHistory(req, res, next) {
    try {
      const { period = '7d' } = req.query;
      const history = await Transaction.getTransactionHistory(period);
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TransactionController();
