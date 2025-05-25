const database = require('../config/database');
const logger = require('../utils/logger');
const Utils = require('../utils/helpers');
const config = require('../config');

class Transaction {
  constructor(data) {
    this.id = data.id;
    this.transactionId = data.transaction_id;
    this.folioId = data.folio_id;
    this.schemeId = data.scheme_id;
    this.customerId = data.customer_id;
    this.transactionType = data.transaction_type;
    this.transactionMode = data.transaction_mode;
    this.amount = parseFloat(data.amount);
    this.units = data.units ? parseFloat(data.units) : 0;
    this.nav = data.nav ? parseFloat(data.nav) : null;
    this.transactionDate = data.transaction_date;
    this.processDate = data.process_date;
    this.settlementDate = data.settlement_date;
    this.status = data.status;
    this.camsStatus = data.cams_status;
    this.camsProcessedDate = data.cams_processed_date;
    this.camsReferenceNumber = data.cams_reference_number;
    this.sourceSchemeId = data.source_scheme_id;
    this.remarks = data.remarks;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async create(transactionData) {
    try {
      const query = `
        INSERT INTO transactions (
          id, transaction_id, folio_id, scheme_id, customer_id,
          transaction_type, transaction_mode, amount, units, nav,
          transaction_date, status, cams_status, source_scheme_id, remarks
        ) VALUES (nextval('transactions_id_seq'), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const values = [
        transactionData.transactionId,
        transactionData.folioId,
        transactionData.schemeId,
        transactionData.customerId,
        transactionData.transactionType,
        transactionData.transactionMode,
        transactionData.amount,
        transactionData.units || 0,
        transactionData.nav,
        transactionData.transactionDate,
        transactionData.status || config.statuses.transaction.SUBMITTED,
        transactionData.camsStatus || config.statuses.cams.PENDING,
        transactionData.sourceSchemeId || null,
        transactionData.remarks || null
      ];

      const result = await database.query(query, values);
      logger.info('Transaction created', { 
        transactionId: result.rows[0].transaction_id,
        folioId: transactionData.folioId,
        amount: transactionData.amount
      });
      return new Transaction(result.rows[0]);
    } catch (error) {
      logger.error('Error creating transaction', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM transactions WHERE id = $1';
      const result = await database.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Transaction(result.rows[0]);
    } catch (error) {
      logger.error('Error finding transaction by ID', error);
      throw error;
    }
  }

  static async findByTransactionId(transactionId) {
    try {
      const query = 'SELECT * FROM transactions WHERE transaction_id = $1';
      const result = await database.query(query, [transactionId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Transaction(result.rows[0]);
    } catch (error) {
      logger.error('Error finding transaction by transaction ID', error);
      throw error;
    }
  }

  static async findByFolio(folioId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT t.*, s.scheme_name, s.scheme_code
        FROM transactions t
        JOIN schemes s ON t.scheme_id = s.id
        WHERE t.folio_id = $1
        ORDER BY t.transaction_date DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await database.query(query, [folioId, limit, offset]);
      return result.rows.map(row => ({
        transaction: new Transaction(row),
        scheme: {
          name: row.scheme_name,
          code: row.scheme_code
        }
      }));
    } catch (error) {
      logger.error('Error finding transactions by folio', error);
      throw error;
    }
  }

  static async findByCustomer(customerId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT t.*, s.scheme_name, s.scheme_code, f.folio_number
        FROM transactions t
        JOIN schemes s ON t.scheme_id = s.id
        JOIN folios f ON t.folio_id = f.id
        WHERE t.customer_id = $1
        ORDER BY t.transaction_date DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await database.query(query, [customerId, limit, offset]);
      return result.rows.map(row => ({
        transaction: new Transaction(row),
        scheme: {
          name: row.scheme_name,
          code: row.scheme_code
        },
        folioNumber: row.folio_number
      }));
    } catch (error) {
      logger.error('Error finding transactions by customer', error);
      throw error;
    }
  }

  static async findPendingForCAMS(limit = 100) {
    try {
      const query = `
        SELECT * FROM transactions 
        WHERE cams_status = $1 
        AND status = $2
        AND transaction_date <= $3
        ORDER BY transaction_date ASC
        LIMIT $4
      `;
      
      // Find transactions submitted at least 5 minutes ago
      const cutoffTime = new Date(Date.now() - config.simulation.camsProcessingDelay);
      
      const result = await database.query(query, [
        config.statuses.cams.PENDING,
        config.statuses.transaction.SUBMITTED,
        cutoffTime,
        limit
      ]);
      
      return result.rows.map(row => new Transaction(row));
    } catch (error) {
      logger.error('Error finding pending CAMS transactions', error);
      throw error;
    }
  }

  static async findByDateRange(fromDate, toDate, limit = 1000, offset = 0) {
    try {
      const query = `
        SELECT t.*, s.scheme_name, s.scheme_code, f.folio_number, 
               c.first_name, c.last_name, c.pan_number
        FROM transactions t
        JOIN schemes s ON t.scheme_id = s.id
        JOIN folios f ON t.folio_id = f.id
        JOIN customers c ON t.customer_id = c.id
        WHERE t.transaction_date BETWEEN $1 AND $2
        ORDER BY t.transaction_date DESC
        LIMIT $3 OFFSET $4
      `;
      
      const result = await database.query(query, [fromDate, toDate, limit, offset]);
      return result.rows.map(row => ({
        transaction: new Transaction(row),
        scheme: {
          name: row.scheme_name,
          code: row.scheme_code
        },
        folio: {
          number: row.folio_number
        },
        customer: {
          name: `${row.first_name} ${row.last_name}`,
          panNumber: row.pan_number
        }
      }));
    } catch (error) {
      logger.error('Error finding transactions by date range', error);
      throw error;
    }
  }

  async process(nav) {
    try {
      const units = Utils.calculateUnits(this.amount, nav);
      const processDate = new Date();
      const settlementDate = Utils.addBusinessDays(processDate, 
        this.transactionType === config.transactionTypes.REDEMPTION ? 3 : 1);

      const query = `
        UPDATE transactions 
        SET 
          units = $1,
          nav = $2,
          process_date = $3,
          settlement_date = $4,
          status = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `;

      const result = await database.query(query, [
        units,
        nav,
        processDate,
        settlementDate,
        config.statuses.transaction.PROCESSED,
        this.id
      ]);

      if (result.rows.length > 0) {
        Object.assign(this, new Transaction(result.rows[0]));
        
        // Update holdings
        await this.updateHoldings();
        
        logger.info('Transaction processed', { 
          transactionId: this.transactionId,
          units,
          nav
        });
      }

      return this;
    } catch (error) {
      logger.error('Error processing transaction', error);
      throw error;
    }
  }

  async updateCAMSStatus(status, camsReferenceNumber = null) {
    try {
      const updateData = {
        camsStatus: status,
        camsProcessedDate: new Date()
      };

      if (camsReferenceNumber) {
        updateData.camsReferenceNumber = camsReferenceNumber;
      }

      const query = `
        UPDATE transactions 
        SET 
          cams_status = $1,
          cams_processed_date = $2,
          cams_reference_number = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;

      const result = await database.query(query, [
        status,
        updateData.camsProcessedDate,
        camsReferenceNumber,
        this.id
      ]);

      if (result.rows.length > 0) {
        Object.assign(this, new Transaction(result.rows[0]));
        logger.info('Transaction CAMS status updated', { 
          transactionId: this.transactionId,
          camsStatus: status,
          camsReference: camsReferenceNumber
        });
      }

      return this;
    } catch (error) {
      logger.error('Error updating CAMS status', error);
      throw error;
    }
  }

  async updateHoldings() {
    try {
      const query = `
        INSERT INTO holdings (folio_id, scheme_id, customer_id, total_units, invested_amount, last_transaction_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (folio_id, scheme_id)
        DO UPDATE SET
          total_units = holdings.total_units + EXCLUDED.total_units,
          invested_amount = holdings.invested_amount + EXCLUDED.invested_amount,
          last_transaction_date = EXCLUDED.last_transaction_date,
          updated_at = CURRENT_TIMESTAMP
      `;

      let unitsChange = this.units;
      let amountChange = this.amount;

      // For redemptions, subtract units and amount
      if (this.transactionMode === config.transactionModes.REDEMPTION) {
        unitsChange = -this.units;
        amountChange = -this.amount;
      }

      await database.query(query, [
        this.folioId,
        this.schemeId,
        this.customerId,
        unitsChange,
        amountChange,
        this.processDate || this.transactionDate
      ]);

      // Update current value based on latest NAV
      await this.updateCurrentValue();

    } catch (error) {
      logger.error('Error updating holdings', error);
      throw error;
    }
  }

  async updateCurrentValue() {
    try {
      const query = `
        UPDATE holdings 
        SET current_value = holdings.total_units * (
          SELECT nav FROM schemes WHERE id = holdings.scheme_id
        )
        WHERE folio_id = $1 AND scheme_id = $2
      `;

      await database.query(query, [this.folioId, this.schemeId]);
    } catch (error) {
      logger.error('Error updating current value', error);
      throw error;
    }
  }

  static async generateRandomTransaction(folioData) {
    const transactionId = Utils.generateTransactionId();
    const transactionType = Utils.getRandomTransactionType();
    const now = new Date();
    
    // Determine transaction mode and type based on transaction type
    let transactionMode, amount;
    
    switch (transactionType) {
      case 'SIP':
        transactionMode = config.transactionModes.SIP;
        amount = Utils.generateRandomAmount(500, 10000);
        break;
      case 'LUMPSUM':
        transactionMode = config.transactionModes.LUMPSUM;
        amount = Utils.generateRandomAmount(1000, 100000);
        break;
      case 'STP':
        transactionMode = config.transactionModes.STP;
        amount = Utils.generateRandomAmount(1000, 50000);
        break;
      case 'REDEMPTION':
        transactionMode = config.transactionModes.REDEMPTION;
        amount = Utils.generateRandomAmount(1000, 25000);
        break;
      default:
        transactionMode = config.transactionModes.LUMPSUM;
        amount = Utils.generateRandomAmount(1000, 50000);
    }

    return {
      transactionId,
      folioId: folioData.folio.id,
      schemeId: folioData.folio.schemeId,
      customerId: folioData.folio.customerId,
      transactionType: transactionMode === config.transactionModes.REDEMPTION ? 
        config.transactionTypes.REDEMPTION : config.transactionTypes.PURCHASE,
      transactionMode,
      amount,
      nav: folioData.nav,
      transactionDate: now,
      status: config.statuses.transaction.SUBMITTED,
      camsStatus: config.statuses.cams.PENDING,
      remarks: `Simulated ${transactionType} transaction`
    };
  }

  static async getTransactionStats(fromDate, toDate) {
    try {
      const query = `
        SELECT 
          transaction_mode,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount,
          status,
          cams_status
        FROM transactions
        WHERE transaction_date BETWEEN $1 AND $2
        GROUP BY transaction_mode, status, cams_status
        ORDER BY transaction_mode, status, cams_status
      `;

      const result = await database.query(query, [fromDate, toDate]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting transaction stats', error);
      throw error;
    }
  }

  isProcessed() {
    return this.status === config.statuses.transaction.PROCESSED;
  }

  isCAMSProcessed() {
    return this.camsStatus === config.statuses.cams.PROCESSED;
  }

  isPurchase() {
    return this.transactionType === config.transactionTypes.PURCHASE;
  }

  isRedemption() {
    return this.transactionType === config.transactionTypes.REDEMPTION;
  }

  toJSON() {
    return {
      id: this.id,
      transactionId: this.transactionId,
      folioId: this.folioId,
      schemeId: this.schemeId,
      customerId: this.customerId,
      transactionType: this.transactionType,
      transactionMode: this.transactionMode,
      amount: this.amount,
      units: this.units,
      nav: this.nav,
      transactionDate: this.transactionDate,
      processDate: this.processDate,
      settlementDate: this.settlementDate,
      status: this.status,
      camsStatus: this.camsStatus,
      camsProcessedDate: this.camsProcessedDate,
      camsReferenceNumber: this.camsReferenceNumber,
      sourceSchemeId: this.sourceSchemeId,
      remarks: this.remarks,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Transaction;
