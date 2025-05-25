const database = require('../config/database');
const logger = require('../utils/logger');
const Utils = require('../utils/helpers');

class Scheme {
  constructor(data) {
    this.id = data.id;
    this.schemeCode = data.scheme_code;
    this.schemeName = data.scheme_name;
    this.amcCode = data.amc_code;
    this.category = data.category;
    this.subCategory = data.sub_category;
    this.nav = parseFloat(data.nav);
    this.minimumInvestment = parseFloat(data.minimum_investment);
    this.minimumSip = parseFloat(data.minimum_sip);
    this.exitLoad = parseFloat(data.exit_load);
    this.expenseRatio = parseFloat(data.expense_ratio);
    this.isActive = data.is_active;
    this.launchDate = data.launch_date;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async create(schemeData) {
    try {
      const query = `
        INSERT INTO schemes (
          scheme_code, scheme_name, amc_code, category, sub_category,
          nav, minimum_investment, minimum_sip, exit_load, expense_ratio,
          is_active, launch_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        schemeData.schemeCode,
        schemeData.schemeName,
        schemeData.amcCode,
        schemeData.category,
        schemeData.subCategory,
        schemeData.nav || 10.0000,
        schemeData.minimumInvestment || 1000.00,
        schemeData.minimumSip || 500.00,
        schemeData.exitLoad || 0.00,
        schemeData.expenseRatio || 1.50,
        schemeData.isActive !== undefined ? schemeData.isActive : true,
        schemeData.launchDate || new Date().toISOString().split('T')[0]
      ];

      const result = await database.query(query, values);
      logger.info('Scheme created', { schemeId: result.rows[0].id, schemeCode: schemeData.schemeCode });
      return new Scheme(result.rows[0]);
    } catch (error) {
      logger.error('Error creating scheme', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM schemes WHERE id = $1';
      const result = await database.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Scheme(result.rows[0]);
    } catch (error) {
      logger.error('Error finding scheme by ID', error);
      throw error;
    }
  }

  static async findByCode(schemeCode) {
    try {
      const query = 'SELECT * FROM schemes WHERE scheme_code = $1';
      const result = await database.query(query, [schemeCode]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Scheme(result.rows[0]);
    } catch (error) {
      logger.error('Error finding scheme by code', error);
      throw error;
    }
  }

  static async findAll(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM schemes 
        WHERE is_active = true
        ORDER BY scheme_name 
        LIMIT $1 OFFSET $2
      `;
      const result = await database.query(query, [limit, offset]);
      return result.rows.map(row => new Scheme(row));
    } catch (error) {
      logger.error('Error finding all schemes', error);
      throw error;
    }
  }

  static async findByCategory(category) {
    try {
      const query = `
        SELECT * FROM schemes 
        WHERE category = $1 AND is_active = true
        ORDER BY scheme_name
      `;
      const result = await database.query(query, [category]);
      return result.rows.map(row => new Scheme(row));
    } catch (error) {
      logger.error('Error finding schemes by category', error);
      throw error;
    }
  }

  static async getRandomScheme() {
    try {
      const query = `
        SELECT * FROM schemes 
        WHERE is_active = true
        ORDER BY RANDOM() 
        LIMIT 1
      `;
      const result = await database.query(query);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Scheme(result.rows[0]);
    } catch (error) {
      logger.error('Error getting random scheme', error);
      throw error;
    }
  }

  static async bulkCreate(schemes) {
    const client = await database.getClient();
    try {
      await client.query('BEGIN');
      
      const createdSchemes = [];
      for (const schemeData of schemes) {
        const query = `
          INSERT INTO schemes (
            scheme_code, scheme_name, amc_code, category, sub_category,
            nav, minimum_investment, minimum_sip, exit_load, expense_ratio,
            is_active, launch_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (scheme_code) DO NOTHING
          RETURNING *
        `;

        const values = [
          schemeData.schemeCode,
          schemeData.schemeName,
          schemeData.amcCode,
          schemeData.category,
          schemeData.subCategory,
          schemeData.nav || 10.0000,
          schemeData.minimumInvestment || 1000.00,
          schemeData.minimumSip || 500.00,
          schemeData.exitLoad || 0.00,
          schemeData.expenseRatio || 1.50,
          schemeData.isActive !== undefined ? schemeData.isActive : true,
          schemeData.launchDate || new Date().toISOString().split('T')[0]
        ];

        const result = await client.query(query, values);
        if (result.rows.length > 0) {
          createdSchemes.push(new Scheme(result.rows[0]));
        }
      }

      await client.query('COMMIT');
      logger.info('Bulk schemes created', { count: createdSchemes.length });
      return createdSchemes;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error bulk creating schemes', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateNAV(newNav) {
    try {
      const query = `
        UPDATE schemes 
        SET nav = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await database.query(query, [newNav, this.id]);
      
      if (result.rows.length > 0) {
        this.nav = parseFloat(newNav);
        this.updatedAt = result.rows[0].updated_at;
        
        // Also insert into NAV history
        await this.insertNAVHistory(newNav);
        
        logger.info('Scheme NAV updated', { 
          schemeId: this.id, 
          schemeCode: this.schemeCode, 
          newNav 
        });
      }

      return this;
    } catch (error) {
      logger.error('Error updating scheme NAV', error);
      throw error;
    }
  }

  async insertNAVHistory(nav, navDate = new Date()) {
    try {
      const query = `
        INSERT INTO nav_history (id, scheme_id, nav_date, nav)
        VALUES (nextval('nav_history_id_seq'), $1, $2, $3)
        ON CONFLICT (scheme_id, nav_date) 
        DO UPDATE SET nav = EXCLUDED.nav
      `;

      await database.query(query, [
        this.id,
        navDate.toISOString().split('T')[0],
        nav
      ]);
    } catch (error) {
      logger.error('Error inserting NAV history', error);
      throw error;
    }
  }

  static async getNAVHistory(schemeId, fromDate, toDate = new Date()) {
    try {
      const query = `
        SELECT * FROM nav_history 
        WHERE scheme_id = $1 
        AND nav_date BETWEEN $2 AND $3
        ORDER BY nav_date DESC
      `;

      const result = await database.query(query, [
        schemeId,
        fromDate.toISOString().split('T')[0],
        toDate.toISOString().split('T')[0]
      ]);

      return result.rows;
    } catch (error) {
      logger.error('Error getting NAV history', error);
      throw error;
    }
  }

  static async getDefaultSchemes() {
    return [
      {
        schemeCode: 'EQU001',
        schemeName: 'Simulation Large Cap Equity Fund',
        amcCode: 'SIMAMC',
        category: 'EQUITY',
        subCategory: 'LARGE_CAP',
        nav: 15.2500,
        minimumInvestment: 5000.00,
        minimumSip: 1000.00,
        exitLoad: 1.00,
        expenseRatio: 2.25
      },
      {
        schemeCode: 'EQU002',
        schemeName: 'Simulation Mid Cap Equity Fund',
        amcCode: 'SIMAMC',
        category: 'EQUITY',
        subCategory: 'MID_CAP',
        nav: 22.3400,
        minimumInvestment: 5000.00,
        minimumSip: 1000.00,
        exitLoad: 1.00,
        expenseRatio: 2.50
      },
      {
        schemeCode: 'EQU003',
        schemeName: 'Simulation Small Cap Equity Fund',
        amcCode: 'SIMAMC',
        category: 'EQUITY',
        subCategory: 'SMALL_CAP',
        nav: 18.7800,
        minimumInvestment: 5000.00,
        minimumSip: 1000.00,
        exitLoad: 1.00,
        expenseRatio: 2.75
      },
      {
        schemeCode: 'DEB001',
        schemeName: 'Simulation Short Term Debt Fund',
        amcCode: 'SIMAMC',
        category: 'DEBT',
        subCategory: 'SHORT_TERM',
        nav: 11.4500,
        minimumInvestment: 1000.00,
        minimumSip: 500.00,
        exitLoad: 0.25,
        expenseRatio: 1.50
      },
      {
        schemeCode: 'DEB002',
        schemeName: 'Simulation Long Term Debt Fund',
        amcCode: 'SIMAMC',
        category: 'DEBT',
        subCategory: 'LONG_TERM',
        nav: 13.2100,
        minimumInvestment: 1000.00,
        minimumSip: 500.00,
        exitLoad: 0.50,
        expenseRatio: 1.75
      },
      {
        schemeCode: 'HYB001',
        schemeName: 'Simulation Balanced Hybrid Fund',
        amcCode: 'SIMAMC',
        category: 'HYBRID',
        subCategory: 'BALANCED',
        nav: 14.6700,
        minimumInvestment: 1000.00,
        minimumSip: 500.00,
        exitLoad: 1.00,
        expenseRatio: 2.00
      },
      {
        schemeCode: 'HYB002',
        schemeName: 'Simulation Conservative Hybrid Fund',
        amcCode: 'SIMAMC',
        category: 'HYBRID',
        subCategory: 'CONSERVATIVE',
        nav: 12.8900,
        minimumInvestment: 1000.00,
        minimumSip: 500.00,
        exitLoad: 0.50,
        expenseRatio: 1.75
      },
      {
        schemeCode: 'ELS001',
        schemeName: 'Simulation Tax Saver ELSS Fund',
        amcCode: 'SIMAMC',
        category: 'EQUITY',
        subCategory: 'ELSS',
        nav: 19.4300,
        minimumInvestment: 500.00,
        minimumSip: 500.00,
        exitLoad: 0.00,
        expenseRatio: 2.25
      },
      {
        schemeCode: 'INT001',
        schemeName: 'Simulation International Equity Fund',
        amcCode: 'SIMAMC',
        category: 'EQUITY',
        subCategory: 'INTERNATIONAL',
        nav: 16.8900,
        minimumInvestment: 5000.00,
        minimumSip: 1000.00,
        exitLoad: 1.00,
        expenseRatio: 2.50
      },
      {
        schemeCode: 'SEC001',
        schemeName: 'Simulation Sectoral Banking Fund',
        amcCode: 'SIMAMC',
        category: 'EQUITY',
        subCategory: 'SECTORAL',
        nav: 21.5600,
        minimumInvestment: 5000.00,
        minimumSip: 1000.00,
        exitLoad: 1.00,
        expenseRatio: 2.75
      }
    ];
  }

  // Simulate NAV movement
  simulateNAVMovement() {
    let change = 0;
    
    // Different volatility based on category
    switch (this.category) {
      case 'EQUITY':
        change = (Math.random() - 0.5) * 0.04; // ±2% daily change
        break;
      case 'DEBT':
        change = (Math.random() - 0.5) * 0.004; // ±0.2% daily change
        break;
      case 'HYBRID':
        change = (Math.random() - 0.5) * 0.02; // ±1% daily change
        break;
      default:
        change = (Math.random() - 0.5) * 0.02;
    }
    
    const newNav = parseFloat((this.nav * (1 + change)).toFixed(4));
    return Math.max(newNav, 1.0000); // Ensure NAV doesn't go below 1
  }

  toJSON() {
    return {
      id: this.id,
      schemeCode: this.schemeCode,
      schemeName: this.schemeName,
      category: this.category,
      subCategory: this.subCategory,
      nav: this.nav,
      minimumInvestment: this.minimumInvestment,
      minimumSip: this.minimumSip,
      exitLoad: this.exitLoad,
      expenseRatio: this.expenseRatio,
      isActive: this.isActive,
      launchDate: this.launchDate
    };
  }

  // Load initial scheme data (create default schemes if none exist)
  static async loadInitialData() {
    try {
      const existingSchemes = await this.findAll(1, 0);
      if (existingSchemes.length === 0) {
        logger.info('No schemes found, loading default schemes...');
        const defaultSchemes = await this.getDefaultSchemes();
        if (defaultSchemes.length > 0) {
          await this.bulkCreate(defaultSchemes);
          logger.info(`Loaded ${defaultSchemes.length} default schemes`);
        }
      } else {
        logger.info(`Found ${existingSchemes.length} existing schemes`);
      }
    } catch (error) {
      logger.error('Error loading initial scheme data', error);
      throw error;
    }
  }
}

module.exports = Scheme;
