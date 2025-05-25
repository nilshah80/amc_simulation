const Customer = require('../models/Customer');
const logger = require('../utils/logger');

class CustomerController {
  async createCustomer(req, res, next) {
    try {
      const customer = await Customer.create(req.body);
      logger.info(`Customer created: ${customer.id}`);
      res.status(201).json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomer(req, res, next) {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllCustomers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      const customers = await Customer.findAll({ page, limit });
      res.json({
        success: true,
        data: customers.customers,
        pagination: {
          page,
          limit,
          total: customers.total,
          pages: Math.ceil(customers.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const customer = await Customer.update(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      logger.info(`Customer updated: ${customer.id}`);
      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCustomer(req, res, next) {
    try {
      const deleted = await Customer.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      logger.info(`Customer deleted: ${req.params.id}`);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async searchCustomers(req, res, next) {
    try {
      const { q, pan } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const customers = await Customer.search({ query: q, pan }, { page, limit });
      res.json({
        success: true,
        data: customers.customers,
        pagination: {
          page,
          limit,
          total: customers.total,
          pages: Math.ceil(customers.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerStats(req, res, next) {
    try {
      const stats = await Customer.getStatistics();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
