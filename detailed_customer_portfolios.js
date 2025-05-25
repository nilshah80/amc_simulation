const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'amc_simulation',
  user: 'amc_user',
  password: 'amc_password'
});

async function showDetailedCustomerPortfolios() {
  try {
    await client.connect();
    
    console.log('💼 DETAILED CUSTOMER PORTFOLIO DASHBOARDS');
    console.log('='.repeat(80));
    
    // Get customers with portfolios
    const customersWithPortfolios = await client.query(`
      SELECT DISTINCT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.risk_profile
      FROM amc.customers c
      INNER JOIN portfolio_summary ps ON c.id = ps.customer_id
      ORDER BY c.id
      LIMIT 2000
    `);
    
    console.log(`👥 Found ${customersWithPortfolios.rows.length} customers with portfolios\n`);
    
    for (const customer of customersWithPortfolios.rows) {
      console.log(`👤 ${customer.first_name} ${customer.last_name} (ID: ${customer.id})`);
      console.log(`   📧 ${customer.email} | 📊 Risk Profile: ${customer.risk_profile}`);
      console.log('   ' + '─'.repeat(70));
      
      // Get portfolio summary for this customer
      const portfolio = await client.query(`
        SELECT 
          ps.scheme_id,
          s.scheme_name,
          s.category,
          ps.total_investment,
          ps.total_units,
          ps.total_transactions,
          ps.last_transaction_date,
          s.nav
        FROM portfolio_summary ps
        INNER JOIN amc.schemes s ON ps.scheme_id = s.id
        WHERE ps.customer_id = $1
        ORDER BY ps.total_investment DESC
      `, [customer.id]);
      
      let totalInvestment = 0;
      let totalCurrentValue = 0;
      
      console.log('   📊 PORTFOLIO HOLDINGS:');
      
      for (const holding of portfolio.rows) {
        const investment = parseFloat(holding.total_investment);
        const nav = parseFloat(holding.nav) || 100; // Default NAV if null
        const currentValue = parseFloat(holding.total_units) * nav;
        const gainLoss = currentValue - investment;
        const gainLossPercent = investment > 0 ? ((gainLoss / investment) * 100) : 0;
        
        totalInvestment += investment;
        totalCurrentValue += currentValue;
        
        console.log(`   🏛️  ${holding.scheme_name} (${holding.category})`);
        console.log(`      💰 Invested: ₹${investment.toFixed(2)} | Current: ₹${currentValue.toFixed(2)}`);
        console.log(`      📈 Units: ${parseFloat(holding.total_units).toFixed(4)} @ NAV ₹${nav.toFixed(2)}`);
        console.log(`      ${gainLoss >= 0 ? '📈' : '📉'} P&L: ₹${gainLoss.toFixed(2)} (${gainLossPercent.toFixed(2)}%)`);
        console.log(`      📅 Last Transaction: ${new Date(holding.last_transaction_date).toLocaleDateString()}`);
        console.log('');
      }
      
      // Portfolio summary
      const totalGainLoss = totalCurrentValue - totalInvestment;
      const totalGainLossPercent = totalInvestment > 0 ? ((totalGainLoss / totalInvestment) * 100) : 0;
      
      console.log('   💼 PORTFOLIO SUMMARY:');
      console.log(`   💰 Total Invested: ₹${totalInvestment.toFixed(2)}`);
      console.log(`   💎 Current Value: ₹${totalCurrentValue.toFixed(2)}`);
      console.log(`   ${totalGainLoss >= 0 ? '📈' : '📉'} Total P&L: ₹${totalGainLoss.toFixed(2)} (${totalGainLossPercent.toFixed(2)}%)`);
      console.log(`   📊 Holdings: ${portfolio.rows.length} schemes`);
      
      // Get recent transactions for this customer
      const recentTxns = await client.query(`
        SELECT 
          t.transaction_type,
          t.amount,
          t.units,
          t.transaction_date,
          s.scheme_name,
          t.cams_status
        FROM amc.transactions t
        INNER JOIN amc.schemes s ON t.scheme_id = s.id
        WHERE t.customer_id = $1
        ORDER BY t.transaction_date DESC
        LIMIT 5
      `, [customer.id]);
      
      console.log('\n   📋 RECENT TRANSACTIONS:');
      for (const txn of recentTxns.rows) {
        const txnDate = new Date(txn.transaction_date).toLocaleDateString();
        const status = txn.cams_status === 'PROCESSED' ? '✅' : '⏳';
        console.log(`   ${status} ${txnDate}: ${txn.transaction_type} ₹${parseFloat(txn.amount).toFixed(2)} in ${txn.scheme_name}`);
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    }
    
    // Overall portfolio statistics
    console.log('📊 OVERALL PORTFOLIO STATISTICS');
    console.log('─'.repeat(50));
    
    const overallStats = await client.query(`
      SELECT 
        COUNT(DISTINCT customer_id) as total_investors,
        COUNT(DISTINCT scheme_id) as schemes_invested,
        SUM(total_investment) as total_aum,
        SUM(total_transactions) as total_transactions,
        AVG(total_investment) as avg_investment_per_customer
      FROM portfolio_summary
    `);
    
    const stats = overallStats.rows[0];
    console.log(`👥 Total Investors: ${stats.total_investors}`);
    console.log(`🏛️  Schemes with Investments: ${stats.schemes_invested}`);
    console.log(`💰 Total AUM: ₹${parseFloat(stats.total_aum).toFixed(2)}`);
    console.log(`📊 Total Transactions: ${stats.total_transactions}`);
    console.log(`📈 Average Investment per Customer: ₹${parseFloat(stats.avg_investment_per_customer).toFixed(2)}`);
    
    // Asset allocation
    console.log('\n🎯 ASSET ALLOCATION BY SCHEME TYPE');
    console.log('─'.repeat(50));
    
    const assetAllocation = await client.query(`
      SELECT 
        s.category,
        COUNT(DISTINCT ps.customer_id) as investors,
        SUM(ps.total_investment) as total_investment,
        COUNT(*) as holdings
      FROM portfolio_summary ps
      INNER JOIN amc.schemes s ON ps.scheme_id = s.id
      GROUP BY s.category
      ORDER BY total_investment DESC
    `);
    
    for (const allocation of assetAllocation.rows) {
      const percentage = (parseFloat(allocation.total_investment) / parseFloat(stats.total_aum)) * 100;
      console.log(`${allocation.category}: ₹${parseFloat(allocation.total_investment).toFixed(2)} (${percentage.toFixed(1)}%) - ${allocation.investors} investors`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

showDetailedCustomerPortfolios(); 