const database = require('../config/database');
const logger = require('../utils/logger');
const Utils = require('../utils/helpers');
const config = require('../config');

class SIP {
  constructor(data) {
    this.id = data.id;
    this.sipId = data.sip_id;
    this.customerId = data.customer_id;
    this.folioId = data.folio_id;
    this.schemeId = data.scheme_id;
    this.amount = parseFloat(data.amount);
    this.frequency = data.frequency;
    this.startDate = data.start_date;
    this.endDate = data.end_date;
    this.nextExecutionDate = data.next_execution_date;
    this.status = data.status;
    this.executionCount = parseInt(data.execution_count) || 0;
    this.maxExecutions = data.max_executions ? parseInt(data.max_executions) : null;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async create(sipData) {
    try {
      const query = `
        INSERT INTO sip_registrations (
          sip_id, customer_id, folio_id, scheme_id, amount,
          frequency, start_date, end_date, next_execution_date,
          status, max_executions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        sipData.sipId,
        sipData.customerId,
        sipData.folioId,
        sipData.schemeId,
        sipData.amount,
        sipData.frequency,
        sipData.startDate,
        sipData.endDate || null,
        sipData.nextExecutionDate,
        sipData.status || config.statuses.sip.ACTIVE,
        sipData.maxExecutions || null
      ];

      const result = await database.query(query, values);
      logger.info('SIP created', { 
        sipId: result.rows[0].sip_id,
        customerId: sipData.customerId,
        amount: sipData.amount,
        frequency: sipData.frequency
      });
      return new SIP(result.rows[0]);
    } catch (error) {
      logger.error('Error creating SIP', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM sip_registrations WHERE id = $1';
      const result = await database.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new SIP(result.rows[0]);
    } catch (error) {
      logger.error('Error finding SIP by ID', error);
      throw error;
    }
  }

  static async findBySipId(sipId) {
    try {
      const query = 'SELECT * FROM sip_registrations WHERE sip_id = $1';
      const result = await database.query(query, [sipId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new SIP(result.rows[0]);
    } catch (error) {
      logger.error('Error finding SIP by SIP ID', error);
      throw error;
    }
  }

  static async findByCustomer(customerId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT s.*, sc.scheme_name, sc.scheme_code, f.folio_number
        FROM sip_registrations s
        JOIN schemes sc ON s.scheme_id = sc.id
        JOIN folios f ON s.folio_id = f.id
        WHERE s.customer_id = $1
        ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await database.query(query, [customerId, limit, offset]);
      return result.rows.map(row => ({
        sip: new SIP(row),
        scheme: {
          name: row.scheme_name,
          code: row.scheme_code
        },
        folioNumber: row.folio_number
      }));
    } catch (error) {
      logger.error('Error finding SIPs by customer', error);
      throw error;
    }
  }

  static async findByFolio(folioId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT s.*, sc.scheme_name, sc.scheme_code
        FROM sip_registrations s
        JOIN schemes sc ON s.scheme_id = sc.id
        WHERE s.folio_id = $1
        ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await database.query(query, [folioId, limit, offset]);
      return result.rows.map(row => ({
        sip: new SIP(row),
        scheme: {
          name: row.scheme_name,
          code: row.scheme_code
        }
      }));
    } catch (error) {
      logger.error('Error finding SIPs by folio', error);
      throw error;
    }
  }

  static async findDueForExecution() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const query = `
        SELECT s.*, sc.nav
        FROM sip_registrations s
        JOIN schemes sc ON s.scheme_id = sc.id
        WHERE s.status = $1 
        AND s.next_execution_date <= $2
        AND (s.end_date IS NULL OR s.end_date >= $2)
        AND (s.max_executions IS NULL OR s.execution_count < s.max_executions)
        ORDER BY s.next_execution_date ASC
      `;
      
      const result = await database.query(query, [config.statuses.sip.ACTIVE, today]);
      return result.rows.map(row => ({
        sip: new SIP(row),
        nav: parseFloat(row.nav)
      }));
    } catch (error) {
      logger.error('Error finding SIPs due for execution', error);
      throw error;
    }
  }

  async execute(nav) {
    const Transaction = require('./Transaction');
    
    try {
      // Create transaction for SIP execution
      const transactionData = {
        transactionId: Utils.generateTransactionId(),
        folioId: this.folioId,
        schemeId: this.schemeId,
        customerId: this.customerId,
        transactionType: config.transactionTypes.PURCHASE,
        transactionMode: config.transactionModes.SIP,
        amount: this.amount,
        nav: nav,
        transactionDate: new Date(),
        status: config.statuses.transaction.SUBMITTED,
        camsStatus: config.statuses.cams.PENDING,
        remarks: `SIP execution for SIP ID: ${this.sipId}`
      };

      const transaction = await Transaction.create(transactionData);
      
      // Process the transaction immediately
      await transaction.process(nav);
      
      // Update SIP execution details
      await this.updateAfterExecution();
      
      logger.info('SIP executed successfully', { 
        sipId: this.sipId,
        transactionId: transaction.transactionId,
        amount: this.amount,
        nav: nav
      });

      return transaction;
    } catch (error) {
      logger.error('Error executing SIP', error);
      throw error;
    }
  }

  async updateAfterExecution() {
    try {
      const newExecutionCount = this.executionCount + 1;
      const nextExecutionDate = Utils.getNextSipExecutionDate(this.frequency, new Date(this.nextExecutionDate));
      
      // Check if SIP should be completed
      let newStatus = this.status;
      if (this.maxExecutions && newExecutionCount >= this.maxExecutions) {
        newStatus = config.statuses.sip.COMPLETED;
      } else if (this.endDate && nextExecutionDate > new Date(this.endDate)) {
        newStatus = config.statuses.sip.COMPLETED;
      }

      const query = `
        UPDATE sip_registrations 
        SET 
          execution_count = $1,
          next_execution_date = $2,
          status = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;

      const result = await database.query(query, [
        newExecutionCount,
        newStatus === config.statuses.sip.COMPLETED ? null : nextExecutionDate,
        newStatus,
        this.id
      ]);

      if (result.rows.length > 0) {
        Object.assign(this, new SIP(result.rows[0]));
      }

      return this;
    } catch (error) {
      logger.error('Error updating SIP after execution', error);
      throw error;
    }
  }

  async pause() {
    try {
      await this.updateStatus(config.statuses.sip.PAUSED);
      logger.info('SIP paused', { sipId: this.sipId });
      return this;
    } catch (error) {
      logger.error('Error pausing SIP', error);
      throw error;
    }
  }

  async resume() {
    try {
      await this.updateStatus(config.statuses.sip.ACTIVE);
      logger.info('SIP resumed', { sipId: this.sipId });
      return this;
    } catch (error) {
      logger.error('Error resuming SIP', error);
      throw error;
    }
  }

  async cancel() {
    try {
      await this.updateStatus(config.statuses.sip.CANCELLED);
      logger.info('SIP cancelled', { sipId: this.sipId });
      return this;
    } catch (error) {
      logger.error('Error cancelling SIP', error);
      throw error;
    }
  }

  async updateStatus(newStatus) {
    try {
      const query = `
        UPDATE sip_registrations 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await database.query(query, [newStatus, this.id]);
      
      if (result.rows.length > 0) {
        Object.assign(this, new SIP(result.rows[0]));
      }

      return this;
    } catch (error) {
      logger.error('Error updating SIP status', error);
      throw error;
    }
  }

  static async generateRandomSIP(folioId, customerId, schemeId) {
    const sipId = Utils.generateSipId();
    const frequencies = ['MONTHLY', 'QUARTERLY'];
    const frequency = Utils.getRandomElement(frequencies);
    
    // Random SIP amount based on scheme category
    const amounts = {
      MONTHLY: [500, 1000, 1500, 2000, 2500, 3000, 5000, 10000],
      QUARTERLY: [1500, 3000, 4500, 6000, 7500, 9000, 15000, 30000]
    };
    
    const amount = Utils.getRandomElement(amounts[frequency]);
    
    // Start date is either today or within the next 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
    
    // End date is optional, 60% of SIPs have end date
    let endDate = null;
    let maxExecutions = null;
    
    if (Utils.randomBoolean(0.6)) {
      if (Utils.randomBoolean(0.5)) {
        // Set end date (1-5 years from start)
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + Math.floor(Math.random() * 5) + 1);
      } else {
        // Set max executions (12-120 executions)
        maxExecutions = Math.floor(Math.random() * 109) + 12;
      }
    }

    const nextExecutionDate = new Date(startDate);

    return {
      sipId,
      customerId,
      folioId,
      schemeId,
      amount,
      frequency,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate ? endDate.toISOString().split('T')[0] : null,
      nextExecutionDate: nextExecutionDate.toISOString().split('T')[0],
      status: config.statuses.sip.ACTIVE,
      maxExecutions
    };
  }

  static async getSIPStats() {
    try {
      const query = `
        SELECT 
          frequency,
          status,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount,
          SUM(execution_count) as total_executions
        FROM sip_registrations
        GROUP BY frequency, status
        ORDER BY frequency, status
      `;

      const result = await database.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting SIP stats', error);
      throw error;
    }
  }

  getRemainingExecutions() {
    if (!this.maxExecutions) return null;
    return Math.max(0, this.maxExecutions - this.executionCount);
  }

  getTotalInvestedAmount() {
    return this.amount * this.executionCount;
  }

  isActive() {
    return this.status === config.statuses.sip.ACTIVE;
  }

  isCompleted() {
    return this.status === config.statuses.sip.COMPLETED;
  }

  isPaused() {
    return this.status === config.statuses.sip.PAUSED;
  }

  isCancelled() {
    return this.status === config.statuses.sip.CANCELLED;
  }

  toJSON() {
    return {
      id: this.id,
      sipId: this.sipId,
      customerId: this.customerId,
      folioId: this.folioId,
      schemeId: this.schemeId,
      amount: this.amount,
      frequency: this.frequency,
      startDate: this.startDate,
      endDate: this.endDate,
      nextExecutionDate: this.nextExecutionDate,
      status: this.status,
      executionCount: this.executionCount,
      maxExecutions: this.maxExecutions,
      remainingExecutions: this.getRemainingExecutions(),
      totalInvestedAmount: this.getTotalInvestedAmount(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = SIP;
