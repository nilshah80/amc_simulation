const SimulationService = require('../services/SimulationService');
const logger = require('../utils/logger');

class SimulationController {
  async getStatus(req, res, next) {
    try {
      const status = await SimulationService.getStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }

  async startSimulation(req, res, next) {
    try {
      const { config } = req.body;
      await SimulationService.start(config);
      logger.info('Simulation started');
      res.json({
        success: true,
        message: 'Simulation started successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async stopSimulation(req, res, next) {
    try {
      await SimulationService.stop();
      logger.info('Simulation stopped');
      res.json({
        success: true,
        message: 'Simulation stopped successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async pauseSimulation(req, res, next) {
    try {
      await SimulationService.pause();
      logger.info('Simulation paused');
      res.json({
        success: true,
        message: 'Simulation paused successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async resumeSimulation(req, res, next) {
    try {
      await SimulationService.resume();
      logger.info('Simulation resumed');
      res.json({
        success: true,
        message: 'Simulation resumed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getMetrics(req, res, next) {
    try {
      const metrics = await SimulationService.getMetrics();
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }

  async updateConfig(req, res, next) {
    try {
      const { config } = req.body;
      await SimulationService.updateConfig(config);
      logger.info('Simulation configuration updated');
      res.json({
        success: true,
        message: 'Configuration updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async triggerCustomerCreation(req, res, next) {
    try {
      const { count = 1 } = req.body;
      const customers = await SimulationService.createCustomers(count);
      logger.info(`Created ${customers.length} customers manually`);
      res.json({
        success: true,
        data: { created: customers.length, customers }
      });
    } catch (error) {
      next(error);
    }
  }

  async triggerFolioCreation(req, res, next) {
    try {
      const { count = 1 } = req.body;
      const folios = await SimulationService.createFolios(count);
      logger.info(`Created ${folios.length} folios manually`);
      res.json({
        success: true,
        data: { created: folios.length, folios }
      });
    } catch (error) {
      next(error);
    }
  }

  async triggerTransactionCreation(req, res, next) {
    try {
      const { count = 1 } = req.body;
      const transactions = await SimulationService.createTransactions(count);
      logger.info(`Created ${transactions.length} transactions manually`);
      res.json({
        success: true,
        data: { created: transactions.length, transactions }
      });
    } catch (error) {
      next(error);
    }
  }

  async resetSimulation(req, res, next) {
    try {
      await SimulationService.reset();
      logger.info('Simulation data reset');
      res.json({
        success: true,
        message: 'Simulation reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SimulationController();
