const axios = require('axios');

class BulkAPIGeneratorSmall {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.targets = {
      customers: 100,
      foliosPerCustomer: 1,
      transactionsPerFolio: 5
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

  async createCustomer() {
    const result = await this.makeRequest('/simulation/trigger/customers', { count: 1 });
    this.progress.customers += result.data.created;
    return result.data.created;
  }

  async createFolio() {
    const result = await this.makeRequest('/simulation/trigger/folios', { count: 1 });
    this.progress.folios += result.data.created;
    return result.data.created;
  }

  async createTransaction() {
    const result = await this.makeRequest('/simulation/trigger/transactions', { count: 1 });
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
    
    if (minutes > 0) {
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
    
    console.log(`📊 ${phase}: ${completed}/${total} (${percentage}%) | Rate: ${rate}/sec | ETA: ${eta}`);
  }

  async generateDataInLoop() {
    console.log('\n🔄 GENERATING DATA IN CUSTOMER->FOLIO->TRANSACTION LOOP');
    console.log('='.repeat(60));
    console.log(`📋 Plan: ${this.targets.customers} customers × ${this.targets.foliosPerCustomer} folios × ${this.targets.transactionsPerFolio} transactions`);
    console.log(`📊 Total: ${this.targets.customers * this.targets.foliosPerCustomer} folios, ${this.targets.customers * this.targets.foliosPerCustomer * this.targets.transactionsPerFolio} transactions`);
    
    const startTime = Date.now();
    
    for (let customerIndex = 1; customerIndex <= this.targets.customers; customerIndex++) {
      try {
        // Create 1 customer
        console.log(`\n👤 Creating Customer ${customerIndex}/${this.targets.customers}...`);
        await this.createCustomer();
        
        // Create 2 folios for this customer
        for (let folioIndex = 1; folioIndex <= this.targets.foliosPerCustomer; folioIndex++) {
          console.log(`  📁 Creating Folio ${folioIndex}/${this.targets.foliosPerCustomer} for Customer ${customerIndex}...`);
          await this.createFolio();
          
          // Create 10 transactions for this folio
          for (let transactionIndex = 1; transactionIndex <= this.targets.transactionsPerFolio; transactionIndex++) {
            await this.createTransaction();
            
            // Show progress every 5 transactions
            if (transactionIndex % 5 === 0) {
              console.log(`    💳 Created ${transactionIndex}/${this.targets.transactionsPerFolio} transactions for Folio ${folioIndex}`);
            }
          }
          
          console.log(`    ✅ Completed all ${this.targets.transactionsPerFolio} transactions for Folio ${folioIndex}`);
          
          // Small delay between folios
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`  ✅ Completed Customer ${customerIndex} with ${this.targets.foliosPerCustomer} folios and ${this.targets.foliosPerCustomer * this.targets.transactionsPerFolio} transactions`);
        
        // Show overall progress every 10 customers
        if (customerIndex % 10 === 0) {
          const elapsed = Date.now() - startTime;
          const totalCustomers = this.targets.customers;
          this.printProgress('Overall Progress', customerIndex, totalCustomers, elapsed);
        }
        
        // Small delay between customers
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Failed to create data for customer ${customerIndex}: ${error.message}`);
        console.log('⏸️  Waiting 3 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Retry the same customer
        customerIndex--;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ All data generation completed in ${this.formatDuration(duration)}`);
    
    // Final summary
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`👥 Customers created: ${this.progress.customers}`);
    console.log(`📁 Folios created: ${this.progress.folios}`);
    console.log(`💳 Transactions created: ${this.progress.transactions}`);
    console.log(`📈 Expected ratios: ${this.progress.folios / this.progress.customers} folios/customer, ${this.progress.transactions / this.progress.folios} transactions/folio`);
  }

  async run() {
    console.log('🚀 BULK API GENERATOR (CONTROLLED LOOP) STARTING');
    console.log('='.repeat(60));
    console.log(`Target: ${this.targets.customers} customers`);
    console.log(`Structure: Each customer → ${this.targets.foliosPerCustomer} folios → ${this.targets.transactionsPerFolio} transactions per folio`);
    
    this.startTime = Date.now();
    
    try {
      // Check initial status
      console.log('\n📊 Checking initial simulation status...');
      const initialStatus = await this.getSimulationStatus();
      if (initialStatus) {
        console.log(`Current session: ${initialStatus.customersCreated} customers, ${initialStatus.foliosCreated} folios, ${initialStatus.transactionsCreated} transactions`);
        console.log(`Total in DB: ${initialStatus.totalCustomers} customers, ${initialStatus.totalFolios} folios, ${initialStatus.totalTransactions} transactions`);
      }
      
      // Generate data in controlled loop
      await this.generateDataInLoop();
      
      // Final status
      console.log('\n🎉 BULK GENERATION COMPLETED!');
      console.log('='.repeat(60));
      
      const totalDuration = Date.now() - this.startTime;
      console.log(`Total time: ${this.formatDuration(totalDuration)}`);
      
      const finalStatus = await this.getSimulationStatus();
      if (finalStatus) {
        console.log(`Final session: ${finalStatus.customersCreated} customers, ${finalStatus.foliosCreated} folios, ${finalStatus.transactionsCreated} transactions`);
        console.log(`Total in DB: ${finalStatus.totalCustomers} customers, ${finalStatus.totalFolios} folios, ${finalStatus.totalTransactions} transactions`);
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
  const generator = new BulkAPIGeneratorSmall();
  generator.run().catch(console.error);
}

module.exports = BulkAPIGeneratorSmall; 