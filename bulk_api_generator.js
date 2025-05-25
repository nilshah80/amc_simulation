const axios = require('axios');

class BulkAPIGenerator {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.batchSizes = {
      customers: 100,    // Create 100 customers per batch
      folios: 200,       // Create 200 folios per batch  
      transactions: 500  // Create 500 transactions per batch
    };
    this.targets = {
      customers: 10000,
      folios: 20000,     // 2 folios per customer
      transactions: 2000000  // 100 transactions per folio
    };
    this.progress = {
      customers: 0,
      folios: 0,
      transactions: 0
    };
    this.startTime = null;
  }

  async makeRequest(endpoint, data) {
    try {
      const response = await axios.post(`${this.baseURL}${endpoint}`, data, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Request failed for ${endpoint}:`, error.message);
      throw error;
    }
  }

  async createCustomersBatch(count) {
    const result = await this.makeRequest('/simulation/trigger/customers', { count });
    this.progress.customers += result.data.created;
    return result.data.created;
  }

  async createFoliosBatch(count) {
    const result = await this.makeRequest('/simulation/trigger/folios', { count });
    this.progress.folios += result.data.created;
    return result.data.created;
  }

  async createTransactionsBatch(count) {
    const result = await this.makeRequest('/simulation/trigger/transactions', { count });
    this.progress.transactions += result.data.created;
    return result.data.created;
  }

  async getSimulationStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/simulation/status`);
      const stats = response.data.data.stats;
      return {
        customersCreated: stats.sessionStats.customersCreated,
        foliosCreated: stats.sessionStats.foliosCreated,
        transactionsCreated: stats.sessionStats.transactionsCreated,
        camsProcessed: stats.sessionStats.camsProcessed,
        totalCustomers: stats.totalCustomers,
        totalFolios: stats.totalFolios,
        totalTransactions: stats.totalTransactions
      };
    } catch (error) {
      console.error('❌ Failed to get simulation status:', error.message);
      return null;
    }
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  calculateETA(completed, total, elapsedMs) {
    if (completed === 0) return 'Calculating...';
    const rate = completed / elapsedMs;
    const remaining = total - completed;
    const etaMs = remaining / rate;
    return this.formatDuration(etaMs);
  }

  printProgress(phase, completed, total, elapsedMs) {
    const percentage = ((completed / total) * 100).toFixed(1);
    const eta = this.calculateETA(completed, total, elapsedMs);
    const rate = Math.round(completed / (elapsedMs / 1000));
    
    console.log(`📊 ${phase}: ${completed.toLocaleString()}/${total.toLocaleString()} (${percentage}%) | Rate: ${rate}/sec | ETA: ${eta}`);
  }

  async generateCustomers() {
    console.log('\n🏗️  PHASE 1: GENERATING CUSTOMERS');
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    let completed = 0;
    
    while (completed < this.targets.customers) {
      const batchSize = Math.min(this.batchSizes.customers, this.targets.customers - completed);
      
      try {
        const created = await this.createCustomersBatch(batchSize);
        completed += created;
        
        const elapsed = Date.now() - startTime;
        this.printProgress('Customers', completed, this.targets.customers, elapsed);
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to create customer batch: ${error.message}`);
        console.log('⏸️  Waiting 5 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Customers completed in ${this.formatDuration(duration)}`);
  }

  async generateFolios() {
    console.log('\n📁 PHASE 2: GENERATING FOLIOS');
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    let completed = 0;
    
    while (completed < this.targets.folios) {
      const batchSize = Math.min(this.batchSizes.folios, this.targets.folios - completed);
      
      try {
        const created = await this.createFoliosBatch(batchSize);
        completed += created;
        
        const elapsed = Date.now() - startTime;
        this.printProgress('Folios', completed, this.targets.folios, elapsed);
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to create folio batch: ${error.message}`);
        console.log('⏸️  Waiting 5 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Folios completed in ${this.formatDuration(duration)}`);
  }

  async generateTransactions() {
    console.log('\n💳 PHASE 3: GENERATING TRANSACTIONS');
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    let completed = 0;
    
    while (completed < this.targets.transactions) {
      const batchSize = Math.min(this.batchSizes.transactions, this.targets.transactions - completed);
      
      try {
        const created = await this.createTransactionsBatch(batchSize);
        completed += created;
        
        const elapsed = Date.now() - startTime;
        this.printProgress('Transactions', completed, this.targets.transactions, elapsed);
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`❌ Failed to create transaction batch: ${error.message}`);
        console.log('⏸️  Waiting 5 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Transactions completed in ${this.formatDuration(duration)}`);
  }

  async run() {
    console.log('🚀 BULK API GENERATOR STARTING');
    console.log('='.repeat(50));
    console.log(`Target: ${this.targets.customers.toLocaleString()} customers, ${this.targets.folios.toLocaleString()} folios, ${this.targets.transactions.toLocaleString()} transactions`);
    console.log(`Batch sizes: ${this.batchSizes.customers} customers, ${this.batchSizes.folios} folios, ${this.batchSizes.transactions} transactions`);
    
    this.startTime = Date.now();
    
    try {
      // Check initial status
      console.log('\n📊 Checking initial simulation status...');
      const initialStatus = await this.getSimulationStatus();
      if (initialStatus) {
        console.log(`Current: ${initialStatus.customersCreated} customers, ${initialStatus.foliosCreated} folios, ${initialStatus.transactionsCreated} transactions`);
      }
      
      // Phase 1: Generate customers
      await this.generateCustomers();
      
      // Phase 2: Generate folios
      await this.generateFolios();
      
      // Phase 3: Generate transactions
      await this.generateTransactions();
      
      // Final status
      console.log('\n🎉 BULK GENERATION COMPLETED!');
      console.log('='.repeat(50));
      
      const totalDuration = Date.now() - this.startTime;
      console.log(`Total time: ${this.formatDuration(totalDuration)}`);
      
      const finalStatus = await this.getSimulationStatus();
      if (finalStatus) {
        console.log(`Final: ${finalStatus.customersCreated} customers, ${finalStatus.foliosCreated} folios, ${finalStatus.transactionsCreated} transactions`);
        console.log(`CAMS processed: ${finalStatus.camsProcessed}`);
      }
      
    } catch (error) {
      console.error('❌ Bulk generation failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new BulkAPIGenerator();
  generator.run().catch(console.error);
}

module.exports = BulkAPIGenerator; 