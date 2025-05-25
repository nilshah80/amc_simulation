const Customer = require('../models/Customer');
const Folio = require('../models/Folio');
const Scheme = require('../models/Scheme');
const Transaction = require('../models/Transaction');
const SIP = require('../models/SIP');
const Utils = require('../utils/helpers');
const logger = require('../utils/logger');
const config = require('../config');
const database = require('../config/database');

class SimulationService {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.startTime = null;
    this.intervals = {};
    this.stats = {
      customersCreated: 0,
      foliosCreated: 0,
      transactionsCreated: 0,
      sipsCreated: 0,
      camsProcessed: 0
    };
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Simulation is already running');
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    logger.info('Starting AMC simulation...');

    try {
      // Initialize schemes
      await this.initializeSchemes();

      // Start simulation intervals
      this.startCustomerCreation();
      this.startFolioCreation();
      this.startTransactionSimulation();
      this.startCAMSProcessing();
      this.startSIPExecution();
      this.startNAVUpdates();

      logger.info('AMC simulation started successfully');
    } catch (error) {
      logger.error('Error starting simulation', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      logger.warn('Simulation is not running');
      return;
    }

    this.isRunning = false;
    
    // Clear all intervals
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    this.intervals = {};

    logger.info('AMC simulation stopped');
  }

  async initializeSchemes() {
    try {
      logger.info('Initializing schemes...');
      
      const existingSchemes = await Scheme.findAll(10);
      if (existingSchemes.length > 0) {
        logger.info(`Found ${existingSchemes.length} existing schemes`);
        return;
      }

      const defaultSchemes = await Scheme.getDefaultSchemes();
      const createdSchemes = await Scheme.bulkCreate(defaultSchemes);
      
      logger.info(`Initialized ${createdSchemes.length} schemes`);

      // Initialize NAV history for all schemes
      for (const scheme of createdSchemes) {
        await scheme.insertNAVHistory(scheme.nav);
      }
    } catch (error) {
      logger.error('Error initializing schemes', error);
      throw error;
    }
  }

  startCustomerCreation() {
    this.intervals.customerCreation = setInterval(async () => {
      try {
        const customerData = await Customer.generateRandomCustomer();
        const customer = await Customer.create(customerData);
        this.stats.customersCreated++;
        
        logger.info('Random customer created', { 
          customerId: customer.id, 
          pan: customer.panNumber,
          name: customer.getFullName()
        });
      } catch (error) {
        logger.error('Error creating random customer', error);
      }
    }, config.simulation.customerCreationInterval);

    logger.info('Started customer creation simulation');
  }

  startFolioCreation() {
    this.intervals.folioCreation = setInterval(async () => {
      try {
        // Create folio for new customer (70% probability)
        if (Utils.randomBoolean(0.7)) {
          await this.createFolioForNewCustomer();
        }

        // Create folio for existing customer (30% probability)
        if (Utils.randomBoolean(0.3)) {
          await this.createFolioForExistingCustomer();
        }
      } catch (error) {
        logger.error('Error in folio creation simulation', error);
      }
    }, config.simulation.folioCreationInterval);

    logger.info('Started folio creation simulation');
  }

  async createFolioForNewCustomer() {
    try {
      const customers = await Customer.findAll(10);
      if (customers.length === 0) return;

      const customer = Utils.getRandomElement(customers);
      const schemes = await Scheme.findAll(10);
      if (schemes.length === 0) return;

      const scheme = Utils.getRandomElement(schemes);
      const folioData = await Folio.generateRandomFolio(customer.id, scheme.id);
      const folio = await Folio.create(folioData);
      
      this.stats.foliosCreated++;
      
      logger.info('Folio created for customer', { 
        folioId: folio.id,
        customerId: customer.id,
        schemeId: scheme.id
      });

      // 60% chance to create a SIP for new folio
      if (Utils.randomBoolean(0.6)) {
        await this.createSIPForFolio(folio.id, customer.id, scheme.id);
      }
    } catch (error) {
      logger.error('Error creating folio for new customer', error);
    }
  }

  async createFolioForExistingCustomer() {
    try {
      const eligibleCustomers = await Customer.getCustomersEligibleForNewFolio(config.simulation.maxFoliosPerCustomer);
      if (eligibleCustomers.length === 0) return;

      const customer = Utils.getRandomElement(eligibleCustomers);
      const schemes = await Scheme.findAll(10);
      if (schemes.length === 0) return;

      const scheme = Utils.getRandomElement(schemes);
      const folioData = await Folio.generateRandomFolio(customer.id, scheme.id);
      const folio = await Folio.create(folioData);
      
      this.stats.foliosCreated++;
      
      logger.info('Additional folio created for existing customer', { 
        folioId: folio.id,
        customerId: customer.id,
        schemeId: scheme.id
      });
    } catch (error) {
      logger.error('Error creating folio for existing customer', error);
    }
  }

  async createSIPForFolio(folioId, customerId, schemeId) {
    try {
      const sipData = await SIP.generateRandomSIP(folioId, customerId, schemeId);
      const sip = await SIP.create(sipData);
      
      this.stats.sipsCreated++;
      
      logger.info('SIP created for folio', { 
        sipId: sip.sipId,
        folioId,
        amount: sip.amount,
        frequency: sip.frequency
      });
    } catch (error) {
      logger.error('Error creating SIP for folio', error);
    }
  }

  startTransactionSimulation() {
    this.intervals.transactionSimulation = setInterval(async () => {
      try {
        // Get random folios for transactions
        const foliosForTransaction = await Folio.getRandomFoliosForTransactions(5);
        
        for (const folioData of foliosForTransaction) {
          // 70% chance to create a transaction for each folio
          if (Utils.randomBoolean(0.7)) {
            const transactionData = await Transaction.generateRandomTransaction(folioData);
            const transaction = await Transaction.create(transactionData);
            
            this.stats.transactionsCreated++;
            
            logger.info('Random transaction created', { 
              transactionId: transaction.transactionId,
              type: transaction.transactionMode,
              amount: transaction.amount
            });
          }
        }
      } catch (error) {
        logger.error('Error in transaction simulation', error);
      }
    }, config.simulation.transactionSimulationInterval);

    logger.info('Started transaction simulation');
  }

  startCAMSProcessing() {
    this.intervals.camsProcessing = setInterval(async () => {
      try {
        const pendingTransactions = await Transaction.findPendingForCAMS(20);
        
        for (const transaction of pendingTransactions) {
          // Simulate CAMS processing with different outcomes
          const processingOutcome = this.simulateCAMSProcessing();
          
          if (processingOutcome.success) {
            // Process the transaction first
            if (!transaction.isProcessed()) {
              await transaction.process(transaction.nav);
            }
            
            // Update CAMS status
            await transaction.updateCAMSStatus(
              config.statuses.cams.PROCESSED, 
              Utils.generateCamsReference()
            );
            
            this.stats.camsProcessed++;
            
            logger.info('Transaction processed by CAMS', { 
              transactionId: transaction.transactionId,
              camsReference: transaction.camsReferenceNumber
            });
          } else {
            // CAMS rejection
            await transaction.updateCAMSStatus(
              config.statuses.cams.REJECTED,
              Utils.generateCamsReference()
            );
            
            logger.info('Transaction rejected by CAMS', { 
              transactionId: transaction.transactionId,
              reason: processingOutcome.reason
            });
          }
        }
      } catch (error) {
        logger.error('Error in CAMS processing simulation', error);
      }
    }, 60000); // Run every minute

    logger.info('Started CAMS processing simulation');
  }

  startSIPExecution() {
    this.intervals.sipExecution = setInterval(async () => {
      try {
        const dueForExecution = await SIP.findDueForExecution();
        
        for (const { sip, nav } of dueForExecution) {
          try {
            await sip.execute(nav);
            logger.info('SIP executed', { 
              sipId: sip.sipId,
              amount: sip.amount,
              executionCount: sip.executionCount + 1
            });
          } catch (error) {
            logger.error('Error executing SIP', { sipId: sip.sipId, error: error.message });
          }
        }
      } catch (error) {
        logger.error('Error in SIP execution', error);
      }
    }, 300000); // Run every 5 minutes

    logger.info('Started SIP execution simulation');
  }

  startNAVUpdates() {
    this.intervals.navUpdates = setInterval(async () => {
      try {
        const schemes = await Scheme.findAll();
        
        for (const scheme of schemes) {
          const newNav = scheme.simulateNAVMovement();
          await scheme.updateNAV(newNav);
          
          logger.debug('NAV updated', { 
            schemeCode: scheme.schemeCode,
            oldNav: scheme.nav,
            newNav
          });
        }

        logger.info('NAV updates completed for all schemes');
      } catch (error) {
        logger.error('Error in NAV updates', error);
      }
    }, 3600000); // Run every hour

    logger.info('Started NAV update simulation');
  }

  simulateCAMSProcessing() {
    // Simulate different CAMS processing outcomes
    const random = Math.random();
    
    if (random < 0.85) {
      // 85% success rate
      return { success: true };
    } else if (random < 0.95) {
      // 10% rejection rate
      return { 
        success: false, 
        reason: Utils.getRandomElement([
          'Insufficient funds',
          'Invalid PAN',
          'KYC not completed',
          'Scheme not active',
          'Minimum investment not met'
        ])
      };
    } else {
      // 5% failure rate (technical issues)
      return { 
        success: false, 
        reason: 'Technical failure - will retry'
      };
    }
  }

  async getSimulationStats() {
    try {
      const [
        totalCustomers,
        totalFolios,
        totalTransactions,
        totalSips
      ] = await Promise.all([
        Customer.findAll(1).then(customers => {
          return database.query('SELECT COUNT(*) as count FROM customers');
        }).then(result => parseInt(result.rows[0].count)),
        
        database.query('SELECT COUNT(*) as count FROM folios').then(result => parseInt(result.rows[0].count)),
        database.query('SELECT COUNT(*) as count FROM transactions').then(result => parseInt(result.rows[0].count)),
        database.query('SELECT COUNT(*) as count FROM sip_registrations').then(result => parseInt(result.rows[0].count))
      ]);

      return {
        isRunning: this.isRunning,
        totalCustomers,
        totalFolios,
        totalTransactions,
        totalSips,
        sessionStats: this.stats,
        uptime: this.isRunning ? Date.now() - this.startTime : 0
      };
    } catch (error) {
      logger.error('Error getting simulation stats', error);
      throw error;
    }
  }

  async resetSimulation() {
    try {
      if (this.isRunning) {
        await this.stop();
      }

      // Reset statistics
      this.stats = {
        customersCreated: 0,
        foliosCreated: 0,
        transactionsCreated: 0,
        sipsCreated: 0,
        camsProcessed: 0
      };

      logger.info('Simulation reset completed');
    } catch (error) {
      logger.error('Error resetting simulation', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      const stats = await this.getSimulationStats();
      return {
        isRunning: this.isRunning,
        isPaused: this.isPaused || false,
        stats,
        intervals: Object.keys(this.intervals),
        uptime: this.isRunning ? Date.now() - (this.startTime || Date.now()) : 0
      };
    } catch (error) {
      logger.error('Error getting simulation status', error);
      throw error;
    }
  }

  async getMetrics() {
    try {
      const stats = await this.getSimulationStats();
      return {
        runtime: {
          isRunning: this.isRunning,
          isPaused: this.isPaused || false,
          uptime: this.isRunning ? Date.now() - (this.startTime || Date.now()) : 0
        },
        totals: {
          customers: stats.totalCustomers,
          folios: stats.totalFolios,
          transactions: stats.totalTransactions,
          sips: stats.totalSips
        },
        sessionStats: this.stats,
        performance: {
          customersPerHour: this.stats.customersCreated / Math.max(1, (Date.now() - (this.startTime || Date.now())) / 3600000),
          transactionsPerHour: this.stats.transactionsCreated / Math.max(1, (Date.now() - (this.startTime || Date.now())) / 3600000)
        }
      };
    } catch (error) {
      logger.error('Error getting simulation metrics', error);
      throw error;
    }
  }

  async pause() {
    if (!this.isRunning) {
      throw new Error('Simulation is not running');
    }
    
    if (this.isPaused) {
      logger.warn('Simulation is already paused');
      return;
    }

    // Clear all intervals but keep the state
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    this.intervals = {};
    
    this.isPaused = true;
    logger.info('AMC simulation paused');
  }

  async resume() {
    if (!this.isRunning) {
      throw new Error('Simulation is not running');
    }
    
    if (!this.isPaused) {
      logger.warn('Simulation is not paused');
      return;
    }

    // Restart all intervals
    this.startCustomerCreation();
    this.startFolioCreation();
    this.startTransactionSimulation();
    this.startCAMSProcessing();
    this.startSIPExecution();
    this.startNAVUpdates();
    
    this.isPaused = false;
    logger.info('AMC simulation resumed');
  }

  // Manual trigger methods for API endpoints
  async createCustomers(count = 1) {
    try {
      const customers = [];
      for (let i = 0; i < count; i++) {
        const customerData = await Customer.generateRandomCustomer();
        const customer = await Customer.create(customerData);
        customers.push(customer);
        this.stats.customersCreated++;
        
        logger.info('Manual customer created', { 
          customerId: customer.id, 
          pan: customer.panNumber,
          name: customer.getFullName()
        });
      }
      
      logger.info(`Manually created ${customers.length} customers`);
      return customers;
    } catch (error) {
      logger.error('Error in manual customer creation', error);
      throw error;
    }
  }

  async createFolios(count = 1) {
    try {
      const folios = [];
      
      for (let i = 0; i < count; i++) {
        // Try to create folio for existing customer first
        const customers = await Customer.findAll(50);
        if (customers.length === 0) {
          throw new Error('No customers available for folio creation');
        }

        const customer = Utils.getRandomElement(customers);
        const schemes = await Scheme.findAll(10);
        if (schemes.length === 0) {
          throw new Error('No schemes available for folio creation');
        }

        const scheme = Utils.getRandomElement(schemes);
        const folioData = await Folio.generateRandomFolio(customer.id, scheme.id);
        const folio = await Folio.create(folioData);
        folios.push(folio);
        this.stats.foliosCreated++;
        
        logger.info('Manual folio created', { 
          folioId: folio.id,
          customerId: customer.id,
          schemeId: scheme.id
        });

        // 50% chance to create a SIP for manual folio
        if (Utils.randomBoolean(0.5)) {
          await this.createSIPForFolio(folio.id, customer.id, scheme.id);
        }
      }
      
      logger.info(`Manually created ${folios.length} folios`);
      return folios;
    } catch (error) {
      logger.error('Error in manual folio creation', error);
      throw error;
    }
  }

  async createTransactions(count = 1) {
    try {
      const transactions = [];
      
      for (let i = 0; i < count; i++) {
        // Get random folios for transactions
        const foliosForTransaction = await Folio.getRandomFoliosForTransactions(10);
        if (foliosForTransaction.length === 0) {
          throw new Error('No folios available for transaction creation');
        }

        const folioData = Utils.getRandomElement(foliosForTransaction);
        const transactionData = await Transaction.generateRandomTransaction(folioData);
        const transaction = await Transaction.create(transactionData);
        transactions.push(transaction);
        this.stats.transactionsCreated++;
        
        logger.info('Manual transaction created', { 
          transactionId: transaction.transactionId,
          type: transaction.transactionMode,
          amount: transaction.amount
        });
      }
      
      logger.info(`Manually created ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      logger.error('Error in manual transaction creation', error);
      throw error;
    }
  }

  async updateConfig(newConfig) {
    try {
      // Update configuration (this would typically update a config store)
      // For now, we'll just log the configuration update
      logger.info('Configuration update requested', { newConfig });
      
      // If simulation is running and intervals need to be updated, restart them
      if (this.isRunning && !this.isPaused) {
        logger.info('Restarting simulation with new configuration');
        await this.stop();
        await this.start();
      }
      
      return { message: 'Configuration updated successfully' };
    } catch (error) {
      logger.error('Error updating configuration', error);
      throw error;
    }
  }

  async reset() {
    try {
      if (this.isRunning) {
        await this.stop();
      }

      // Reset statistics
      this.stats = {
        customersCreated: 0,
        foliosCreated: 0,
        transactionsCreated: 0,
        sipsCreated: 0,
        camsProcessed: 0
      };

      this.startTime = null;
      this.isPaused = false;

      logger.info('Simulation reset completed');
      return { message: 'Simulation reset successfully' };
    } catch (error) {
      logger.error('Error resetting simulation', error);
      throw error;
    }
  }
}

module.exports = new SimulationService();
