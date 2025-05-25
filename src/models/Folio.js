const database = require('../config/database');
const logger = require('../utils/logger');
const Utils = require('../utils/helpers');

class Folio {
  constructor(data) {
    this.id = data.id;
    this.folioNumber = data.folio_number;
    this.customerId = data.customer_id;
    this.schemeId = data.scheme_id;
    this.status = data.status;
    this.nominationRegistered = data.nomination_registered;
    this.jointHolder1 = data.joint_holder_1;
    this.jointHolder2 = data.joint_holder_2;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async create(folioData) {
    try {
      const query = `
        INSERT INTO folios (
          folio_number, customer_id, scheme_id, status,
          nomination_registered, joint_holder_1, joint_holder_2
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        folioData.folioNumber,
        folioData.customerId,
        folioData.schemeId,
        folioData.status || 'ACTIVE',
        folioData.nominationRegistered || false,
        folioData.jointHolder1 || null,
        folioData.jointHolder2 || null
      ];

      const result = await database.query(query, values);
      logger.info('Folio created', { 
        folioId: result.rows[0].id, 
        folioNumber: folioData.folioNumber,
        customerId: folioData.customerId,
        schemeId: folioData.schemeId
      });
      return new Folio(result.rows[0]);
    } catch (error) {
      logger.error('Error creating folio', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM folios WHERE id = $1';
      const result = await database.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Folio(result.rows[0]);
    } catch (error) {
      logger.error('Error finding folio by ID', error);
      throw error;
    }
  }

  static async findByNumber(folioNumber) {
    try {
      const query = 'SELECT * FROM folios WHERE folio_number = $1';
      const result = await database.query(query, [folioNumber]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Folio(result.rows[0]);
    } catch (error) {
      logger.error('Error finding folio by number', error);
      throw error;
    }
  }

  static async findByCustomer(customerId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT f.*, s.scheme_name, s.scheme_code, s.category
        FROM folios f
        JOIN schemes s ON f.scheme_id = s.id
        WHERE f.customer_id = $1
        ORDER BY f.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await database.query(query, [customerId, limit, offset]);
      return result.rows.map(row => ({
        folio: new Folio(row),
        scheme: {
          name: row.scheme_name,
          code: row.scheme_code,
          category: row.category
        }
      }));
    } catch (error) {
      logger.error('Error finding folios by customer', error);
      throw error;
    }
  }

  static async findByScheme(schemeId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT f.*, c.first_name, c.last_name, c.pan_number
        FROM folios f
        JOIN customers c ON f.customer_id = c.id
        WHERE f.scheme_id = $1
        ORDER BY f.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await database.query(query, [schemeId, limit, offset]);
      return result.rows.map(row => ({
        folio: new Folio(row),
        customer: {
          name: `${row.first_name} ${row.last_name}`,
          panNumber: row.pan_number
        }
      }));
    } catch (error) {
      logger.error('Error finding folios by scheme', error);
      throw error;
    }
  }

  static async getRandomFolio() {
    try {
      const query = `
        SELECT * FROM folios 
        WHERE status = 'ACTIVE'
        ORDER BY RANDOM() 
        LIMIT 1
      `;
      const result = await database.query(query);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Folio(result.rows[0]);
    } catch (error) {
      logger.error('Error getting random folio', error);
      throw error;
    }
  }

  static async getRandomFoliosForTransactions(limit = 10) {
    try {
      const query = `
        SELECT f.*, c.risk_profile, s.category, s.nav
        FROM folios f
        JOIN customers c ON f.customer_id = c.id
        JOIN schemes s ON f.scheme_id = s.id
        WHERE f.status = 'ACTIVE' AND c.kyc_status = 'COMPLETED'
        ORDER BY RANDOM()
        LIMIT $1
      `;
      const result = await database.query(query, [limit]);
      return result.rows.map(row => ({
        folio: new Folio(row),
        riskProfile: row.risk_profile,
        schemeCategory: row.category,
        nav: parseFloat(row.nav)
      }));
    } catch (error) {
      logger.error('Error getting random folios for transactions', error);
      throw error;
    }
  }

  static async countByCustomer(customerId) {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM folios 
        WHERE customer_id = $1 AND status = 'ACTIVE'
      `;
      const result = await database.query(query, [customerId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting folios by customer', error);
      throw error;
    }
  }

  static async getFolioWithHoldings(folioId) {
    try {
      const query = `
        SELECT 
          f.*,
          c.first_name, c.last_name, c.pan_number,
          s.scheme_name, s.scheme_code, s.category, s.nav,
          h.total_units, h.current_value, h.invested_amount
        FROM folios f
        JOIN customers c ON f.customer_id = c.id
        JOIN schemes s ON f.scheme_id = s.id
        LEFT JOIN holdings h ON f.id = h.folio_id
        WHERE f.id = $1
      `;
      const result = await database.query(query, [folioId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        folio: new Folio(row),
        customer: {
          name: `${row.first_name} ${row.last_name}`,
          panNumber: row.pan_number
        },
        scheme: {
          name: row.scheme_name,
          code: row.scheme_code,
          category: row.category,
          nav: parseFloat(row.nav)
        },
        holdings: {
          totalUnits: row.total_units ? parseFloat(row.total_units) : 0,
          currentValue: row.current_value ? parseFloat(row.current_value) : 0,
          investedAmount: row.invested_amount ? parseFloat(row.invested_amount) : 0
        }
      };
    } catch (error) {
      logger.error('Error getting folio with holdings', error);
      throw error;
    }
  }

  async update(updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCounter = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined && key !== 'id') {
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          fields.push(`${dbKey} = $${paramCounter}`);
          values.push(value);
          paramCounter++;
        }
      }

      if (fields.length === 0) {
        return this;
      }

      values.push(this.id);
      const query = `
        UPDATE folios 
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCounter}
        RETURNING *
      `;

      const result = await database.query(query, values);
      
      if (result.rows.length > 0) {
        Object.assign(this, new Folio(result.rows[0]));
        logger.info('Folio updated', { folioId: this.id });
      }

      return this;
    } catch (error) {
      logger.error('Error updating folio', error);
      throw error;
    }
  }

  async close() {
    try {
      await this.update({ status: 'CLOSED' });
      logger.info('Folio closed', { folioId: this.id, folioNumber: this.folioNumber });
      return this;
    } catch (error) {
      logger.error('Error closing folio', error);
      throw error;
    }
  }

  static async generateRandomFolio(customerId, schemeId) {
    const folioNumber = Utils.generateFolioNumber(customerId);
    
    return {
      folioNumber,
      customerId,
      schemeId,
      status: 'ACTIVE',
      nominationRegistered: Utils.randomBoolean(0.3), // 30% have nomination
      jointHolder1: Utils.randomBoolean(0.2) ? Utils.generateRandomName().firstName + ' ' + Utils.generateRandomName().lastName : null,
      jointHolder2: Utils.randomBoolean(0.1) ? Utils.generateRandomName().firstName + ' ' + Utils.generateRandomName().lastName : null
    };
  }

  // Get folio summary with transactions
  async getSummary() {
    try {
      const query = `
        SELECT 
          COUNT(t.id) as transaction_count,
          SUM(CASE WHEN t.transaction_mode IN ('PURCHASE', 'SIP', 'LUMPSUM') THEN t.amount ELSE 0 END) as total_invested,
          SUM(CASE WHEN t.transaction_mode = 'REDEMPTION' THEN t.amount ELSE 0 END) as total_redeemed,
          MAX(t.transaction_date) as last_transaction_date
        FROM transactions t
        WHERE t.folio_id = $1 AND t.status = 'PROCESSED'
      `;
      
      const result = await database.query(query, [this.id]);
      const summary = result.rows[0];
      
      return {
        folioNumber: this.folioNumber,
        status: this.status,
        transactionCount: parseInt(summary.transaction_count) || 0,
        totalInvested: parseFloat(summary.total_invested) || 0,
        totalRedeemed: parseFloat(summary.total_redeemed) || 0,
        lastTransactionDate: summary.last_transaction_date,
        createdAt: this.createdAt
      };
    } catch (error) {
      logger.error('Error getting folio summary', error);
      throw error;
    }
  }

  isActive() {
    return this.status === 'ACTIVE';
  }

  toJSON() {
    return {
      id: this.id,
      folioNumber: this.folioNumber,
      customerId: this.customerId,
      schemeId: this.schemeId,
      status: this.status,
      nominationRegistered: this.nominationRegistered,
      jointHolder1: this.jointHolder1,
      jointHolder2: this.jointHolder2,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Folio;
