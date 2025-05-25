const database = require('../config/database');
const logger = require('../utils/logger');
const Utils = require('../utils/helpers');

class Customer {
  constructor(data) {
    this.id = data.id;
    this.panNumber = data.pan_number;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.email = data.email;
    this.phone = data.phone;
    this.dateOfBirth = data.date_of_birth;
    this.address = data.address;
    this.kycStatus = data.kyc_status;
    this.riskProfile = data.risk_profile;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async create(customerData) {
    try {
      const query = `
        INSERT INTO customers (
          pan_number, first_name, last_name, email, phone, 
          date_of_birth, address, kyc_status, risk_profile
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        customerData.panNumber,
        customerData.firstName,
        customerData.lastName,
        customerData.email,
        customerData.phone,
        customerData.dateOfBirth,
        customerData.address,
        customerData.kycStatus || 'PENDING',
        customerData.riskProfile || 'MODERATE'
      ];

      const result = await database.query(query, values);
      logger.info('Customer created', { customerId: result.rows[0].id, pan: customerData.panNumber });
      return new Customer(result.rows[0]);
    } catch (error) {
      logger.error('Error creating customer', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM customers WHERE id = $1';
      const result = await database.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Customer(result.rows[0]);
    } catch (error) {
      logger.error('Error finding customer by ID', error);
      throw error;
    }
  }

  static async findByPAN(panNumber) {
    try {
      const query = 'SELECT * FROM customers WHERE pan_number = $1';
      const result = await database.query(query, [panNumber]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Customer(result.rows[0]);
    } catch (error) {
      logger.error('Error finding customer by PAN', error);
      throw error;
    }
  }

  static async findAll(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM customers 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      const result = await database.query(query, [limit, offset]);
      return result.rows.map(row => new Customer(row));
    } catch (error) {
      logger.error('Error finding all customers', error);
      throw error;
    }
  }

  static async getRandomCustomer() {
    try {
      const query = `
        SELECT * FROM customers 
        ORDER BY RANDOM() 
        LIMIT 1
      `;
      const result = await database.query(query);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Customer(result.rows[0]);
    } catch (error) {
      logger.error('Error getting random customer', error);
      throw error;
    }
  }

  static async getCustomersWithFolioCount() {
    try {
      const query = `
        SELECT c.*, COUNT(f.id) as folio_count
        FROM customers c
        LEFT JOIN folios f ON c.id = f.customer_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
      const result = await database.query(query);
      return result.rows.map(row => ({
        customer: new Customer(row),
        folioCount: parseInt(row.folio_count)
      }));
    } catch (error) {
      logger.error('Error getting customers with folio count', error);
      throw error;
    }
  }

  static async getCustomersEligibleForNewFolio(maxFolios = 100) {
    try {
      const query = `
        SELECT c.*, COUNT(f.id) as folio_count
        FROM customers c
        LEFT JOIN folios f ON c.id = f.customer_id AND f.status = 'ACTIVE'
        GROUP BY c.id
        HAVING COUNT(f.id) < $1
        ORDER BY RANDOM()
        LIMIT 10
      `;
      const result = await database.query(query, [maxFolios]);
      return result.rows.map(row => new Customer(row));
    } catch (error) {
      logger.error('Error getting customers eligible for new folio', error);
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
        UPDATE customers 
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCounter}
        RETURNING *
      `;

      const result = await database.query(query, values);
      
      if (result.rows.length > 0) {
        Object.assign(this, new Customer(result.rows[0]));
        logger.info('Customer updated', { customerId: this.id });
      }

      return this;
    } catch (error) {
      logger.error('Error updating customer', error);
      throw error;
    }
  }

  async delete() {
    try {
      const query = 'DELETE FROM customers WHERE id = $1';
      await database.query(query, [this.id]);
      logger.info('Customer deleted', { customerId: this.id });
      return true;
    } catch (error) {
      logger.error('Error deleting customer', error);
      throw error;
    }
  }

  static async generateRandomCustomer() {
    const { firstName, lastName } = Utils.generateRandomName();
    const panNumber = Utils.generatePAN();
    const email = Utils.generateEmail(firstName, lastName);
    const phone = Utils.generatePhoneNumber();
    const riskProfile = Utils.getRandomRiskProfile();
    
    // Generate random date of birth (18-80 years old)
    const minAge = 18;
    const maxAge = 80;
    const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
    const dateOfBirth = new Date();
    dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);
    
    const addresses = [
      'Mumbai, Maharashtra',
      'Delhi, Delhi',
      'Bangalore, Karnataka',
      'Hyderabad, Telangana',
      'Chennai, Tamil Nadu',
      'Kolkata, West Bengal',
      'Pune, Maharashtra',
      'Ahmedabad, Gujarat'
    ];

    return {
      panNumber,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: dateOfBirth.toISOString().split('T')[0],
      address: Utils.getRandomElement(addresses),
      kycStatus: Utils.randomBoolean(0.8) ? 'COMPLETED' : 'PENDING',
      riskProfile
    };
  }

  // Get customer's full name
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Get customer's age
  getAge() {
    return Utils.calculateAge(this.dateOfBirth);
  }

  // Check if customer is KYC completed
  isKycCompleted() {
    return this.kycStatus === 'COMPLETED';
  }

  // Get customer summary
  toJSON() {
    return {
      id: this.id,
      panNumber: this.panNumber,
      fullName: this.getFullName(),
      email: this.email,
      phone: this.phone,
      age: this.getAge(),
      kycStatus: this.kycStatus,
      riskProfile: this.riskProfile,
      createdAt: this.createdAt
    };
  }
}

module.exports = Customer;
