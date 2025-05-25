const { Client } = require('pg');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'amc_simulation',
  user: 'amc_user',
  password: 'amc_password'
};

class FinancialAnalyticsDemo {
  constructor() {
    this.client = new Client(dbConfig);
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.end();
  }

  async runFinancialDemo() {
    try {
      await this.connect();
      
      console.log('💼 Financial Analytics with TimescaleDB Continuous Aggregates');
      console.log('='.repeat(80));
      
      await this.demonstrateContinuousAggregates();
      await this.realTimeDashboardMetrics();
      await this.portfolioPerformanceAnalytics();
      await this.riskAnalytics();
      await this.liquidityAnalysis();
      await this.regulatoryReporting();
      await this.comparePerformance();
      
    } catch (error) {
      console.error('❌ Error in financial demo:', error.message);
    } finally {
      await this.disconnect();
    }
  }

  async demonstrateContinuousAggregates() {
    console.log('\n📊 CONTINUOUS AGGREGATES DEMONSTRATION');
    console.log('-'.repeat(60));

    console.log('🚀 What are Continuous Aggregates?');
    console.log('   ✅ Pre-computed materialized views that update automatically');
    console.log('   ✅ Sub-millisecond query performance (vs seconds for raw queries)');
    console.log('   ✅ Incremental updates as new data arrives');
    console.log('   ✅ Perfect for real-time dashboards and reporting');
    console.log('');

    // Show available continuous aggregates
    const aggregates = await this.client.query(`
      SELECT 
        view_name,
        materialization_hypertable_name,
        compression_enabled,
        materialized_only
      FROM timescaledb_information.continuous_aggregates
    `);
    
    console.log('📈 Available Continuous Aggregates:');
    aggregates.rows.forEach(row => {
      console.log(`   🔍 ${row.view_name}:`);
      console.log(`      📦 Materialization table: ${row.materialization_hypertable_name}`);
      console.log(`      🗜️  Compression: ${row.compression_enabled ? 'ENABLED' : 'DISABLED'}`);
      console.log('');
    });

    // Demonstrate instant queries
    console.log('⚡ Performance Demonstration:');
    
    // Query 1: Daily metrics (instant)
    const start1 = performance.now();
    const dailyMetrics = await this.client.query(`
      SELECT day, total_transactions, total_volume, active_customers, active_schemes
      FROM daily_metrics 
      ORDER BY day DESC 
      LIMIT 5
    `);
    const end1 = performance.now();
    
    console.log(`   📊 Daily Metrics Query: ${(end1 - start1).toFixed(2)}ms`);
    console.log('      (This would take 100-1000ms on raw transaction data)');
    
    // Query 2: Hourly metrics (instant)
    const start2 = performance.now();
    const hourlyMetrics = await this.client.query(`
      SELECT hour, hourly_transactions, hourly_volume, hourly_customers
      FROM hourly_metrics 
      WHERE hour >= NOW() - INTERVAL '24 hours'
      ORDER BY hour DESC 
      LIMIT 5
    `);
    const end2 = performance.now();
    
    console.log(`   📈 Hourly Metrics Query: ${(end2 - start2).toFixed(2)}ms`);
    console.log('      (This would take 50-500ms on raw transaction data)');
    
    // Query 3: Customer portfolio (instant)
    const start3 = performance.now();
    const portfolioMetrics = await this.client.query(`
      SELECT customer_id, scheme_id, net_investment, net_units, transaction_count
      FROM customer_daily_portfolio 
      WHERE day >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY net_investment DESC 
      LIMIT 5
    `);
    const end3 = performance.now();
    
    console.log(`   👤 Portfolio Metrics Query: ${(end3 - start3).toFixed(2)}ms`);
    console.log('      (This would take 200-2000ms on raw transaction data)');
    console.log('');
  }

  async realTimeDashboardMetrics() {
    console.log('\n🎯 REAL-TIME DASHBOARD METRICS (Using Continuous Aggregates)');
    console.log('-'.repeat(60));

    // Dashboard KPIs (instant query using helper view)
    console.log('📊 Today\'s Business KPIs (Sub-millisecond Query):');
    const start = performance.now();
    
    const dashboardKPIs = await this.client.query(`
      SELECT 
        total_transactions_today,
        total_volume_today,
        active_customers_today,
        active_schemes_today,
        avg_transaction_size_today,
        sip_transactions_today,
        lumpsum_transactions_today,
        redemption_transactions_today,
        processing_success_rate
      FROM dashboard_kpis
    `);
    
    const end = performance.now();
    console.log(`   ⚡ Query Time: ${(end - start).toFixed(2)}ms`);
    
    if (dashboardKPIs.rows.length > 0) {
      const kpi = dashboardKPIs.rows[0];
      console.log('   📈 Today\'s Performance:');
      console.log(`      💰 Total Volume: ₹${parseFloat(kpi.total_volume_today || 0).toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
      console.log(`      📊 Total Transactions: ${kpi.total_transactions_today || 0}`);
      console.log(`      👥 Active Customers: ${kpi.active_customers_today || 0}`);
      console.log(`      🏛️ Active Schemes: ${kpi.active_schemes_today || 0}`);
      console.log(`      💡 Avg Transaction: ₹${parseFloat(kpi.avg_transaction_size_today || 0).toLocaleString('en-IN', {maximumFractionDigits: 2})}`);
      console.log(`      📈 Processing Success: ${kpi.processing_success_rate || 0}%`);
    } else {
      console.log('   ℹ️  No data available (simulation may be starting)');
    }
    console.log('');

    // Live operational metrics
    console.log('⚡ Live Operational Metrics (Hourly Trends):');
    const hourlyStart = performance.now();
    
    const hourlyTrends = await this.client.query(`
      SELECT 
        hour,
        hourly_transactions,
        hourly_volume,
        hourly_customers,
        max_transaction,
        min_transaction
      FROM hourly_metrics 
      WHERE hour >= NOW() - INTERVAL '12 hours'
      ORDER BY hour DESC
      LIMIT 8
    `);
    
    const hourlyEnd = performance.now();
    console.log(`   ⚡ Query Time: ${(hourlyEnd - hourlyStart).toFixed(2)}ms`);
    
    if (hourlyTrends.rows.length > 0) {
      hourlyTrends.rows.forEach(row => {
        const volume = parseFloat(row.hourly_volume || 0);
        const maxTxn = parseFloat(row.max_transaction || 0);
        const hour = new Date(row.hour).toLocaleString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        });
        console.log(`   🕐 ${hour}: ${row.hourly_transactions || 0} txns, ₹${volume.toLocaleString('en-IN', {maximumFractionDigits: 0})}, Max: ₹${maxTxn.toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
      });
    } else {
      console.log('   ℹ️  No hourly data available yet');
    }
    console.log('');
  }

  async portfolioPerformanceAnalytics() {
    console.log('\n📈 PORTFOLIO PERFORMANCE ANALYTICS (Using Materialized Views)');
    console.log('-'.repeat(60));

    // Portfolio summary using optimized view
    console.log('💼 Customer Portfolio Summary (Instant Query):');
    const portfolioStart = performance.now();
    
    const portfolioSummary = await this.client.query(`
      SELECT 
        customer_id,
        scheme_id,
        total_investment,
        total_units,
        total_transactions,
        last_transaction_date
      FROM portfolio_summary
      WHERE total_investment > 1000
      ORDER BY total_investment DESC
      LIMIT 10
    `);
    
    const portfolioEnd = performance.now();
    console.log(`   ⚡ Query Time: ${(portfolioEnd - portfolioStart).toFixed(2)}ms`);
    
    portfolioSummary.rows.forEach(row => {
      const investment = parseFloat(row.total_investment);
      const units = parseFloat(row.total_units);
      const currentValue = units * 16.5; // Assuming current NAV
      const gain = currentValue - investment;
      const gainPct = investment > 0 ? (gain / investment * 100) : 0;
      
      console.log(`   👤 Customer ${row.customer_id} - Scheme ${row.scheme_id}:`);
      console.log(`      💰 Investment: ₹${investment.toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
      console.log(`      🏆 Current Value: ₹${currentValue.toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
      console.log(`      📈 Gain: ₹${gain.toLocaleString('en-IN', {maximumFractionDigits: 0})} (${gainPct.toFixed(2)}%)`);
      console.log(`      📊 Units: ${units.toFixed(3)}, Transactions: ${row.total_transactions}`);
      console.log('');
    });

    // Portfolio evolution using continuous aggregates
    console.log('📊 Portfolio Evolution Over Time:');
    const evolutionStart = performance.now();
    
    const portfolioEvolution = await this.client.query(`
      SELECT 
        day,
        customer_id,
        SUM(net_investment) OVER (PARTITION BY customer_id ORDER BY day) as cumulative_investment,
        SUM(net_units) OVER (PARTITION BY customer_id ORDER BY day) as cumulative_units,
        SUM(transaction_count) OVER (PARTITION BY customer_id ORDER BY day) as cumulative_transactions
      FROM customer_daily_portfolio
      WHERE customer_id IN (
        SELECT customer_id FROM portfolio_summary 
        ORDER BY total_investment DESC LIMIT 3
      )
      ORDER BY customer_id, day DESC
      LIMIT 15
    `);
    
    const evolutionEnd = performance.now();
    console.log(`   ⚡ Query Time: ${(evolutionEnd - evolutionStart).toFixed(2)}ms`);
    
    portfolioEvolution.rows.forEach(row => {
      const cumInvestment = parseFloat(row.cumulative_investment);
      const cumUnits = parseFloat(row.cumulative_units);
      const currentValue = cumUnits * 16.5;
      
      console.log(`   👤 Customer ${row.customer_id} on ${row.day}:`);
      console.log(`      📈 Cumulative: ₹${cumInvestment.toLocaleString('en-IN', {maximumFractionDigits: 0})} invested, ${cumUnits.toFixed(3)} units, ₹${currentValue.toLocaleString('en-IN', {maximumFractionDigits: 0})} value`);
    });
    console.log('');
  }

  async riskAnalytics() {
    console.log('\n⚠️ RISK ANALYTICS (Using Optimized Views)');
    console.log('-'.repeat(60));

    // Concentration risk using portfolio summary
    console.log('🎯 Portfolio Concentration Risk Analysis:');
    const riskStart = performance.now();
    
    const concentrationRisk = await this.client.query(`
      WITH customer_totals AS (
        SELECT 
          customer_id,
          SUM(total_investment) as total_portfolio_value
        FROM portfolio_summary
        GROUP BY customer_id
        HAVING SUM(total_investment) > 5000
      )
      SELECT 
        ps.customer_id,
        ps.scheme_id,
        ps.total_investment,
        ct.total_portfolio_value,
        ROUND((ps.total_investment / ct.total_portfolio_value * 100), 2) as concentration_pct,
        CASE 
          WHEN (ps.total_investment / ct.total_portfolio_value) > 0.7 THEN 'HIGH RISK'
          WHEN (ps.total_investment / ct.total_portfolio_value) > 0.4 THEN 'MEDIUM RISK'
          ELSE 'LOW RISK'
        END as risk_level
      FROM portfolio_summary ps
      JOIN customer_totals ct ON ps.customer_id = ct.customer_id
      WHERE ps.total_investment > 1000
      ORDER BY concentration_pct DESC
      LIMIT 10
    `);
    
    const riskEnd = performance.now();
    console.log(`   ⚡ Query Time: ${(riskEnd - riskStart).toFixed(2)}ms`);
    
    concentrationRisk.rows.forEach(row => {
      const investment = parseFloat(row.total_investment);
      const portfolio = parseFloat(row.total_portfolio_value);
      
      console.log(`   👤 Customer ${row.customer_id} - Scheme ${row.scheme_id}:`);
      console.log(`      💰 Investment: ₹${investment.toLocaleString('en-IN', {maximumFractionDigits: 0})} of ₹${portfolio.toLocaleString('en-IN', {maximumFractionDigits: 0})} (${row.concentration_pct}%)`);
      console.log(`      ⚠️ Risk Level: ${row.risk_level}`);
      console.log('');
    });
  }

  async liquidityAnalysis() {
    console.log('\n💧 LIQUIDITY ANALYSIS (Using Hourly Metrics)');
    console.log('-'.repeat(60));

    // Liquidity patterns using hourly metrics
    console.log('📊 Hourly Liquidity Patterns:');
    const liquidityStart = performance.now();
    
    const liquidityPatterns = await this.client.query(`
      SELECT 
        EXTRACT(HOUR FROM hour) as hour_of_day,
        AVG(hourly_transactions) as avg_transactions,
        AVG(hourly_volume) as avg_volume,
        AVG(hourly_customers) as avg_customers,
        COUNT(*) as data_points
      FROM hourly_metrics
      WHERE hour >= NOW() - INTERVAL '7 days'
      GROUP BY EXTRACT(HOUR FROM hour)
      ORDER BY avg_volume DESC
      LIMIT 10
    `);
    
    const liquidityEnd = performance.now();
    console.log(`   ⚡ Query Time: ${(liquidityEnd - liquidityStart).toFixed(2)}ms`);
    
    liquidityPatterns.rows.forEach(row => {
      const avgVolume = parseFloat(row.avg_volume);
      
      console.log(`   🕐 Hour ${row.hour_of_day}:00:`);
      console.log(`      📊 Avg Transactions: ${parseFloat(row.avg_transactions).toFixed(1)}`);
      console.log(`      💰 Avg Volume: ₹${avgVolume.toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
      console.log(`      👥 Avg Customers: ${parseFloat(row.avg_customers).toFixed(1)}`);
      console.log(`      📈 Data Points: ${row.data_points} hours`);
      console.log('');
    });
  }

  async regulatoryReporting() {
    console.log('\n📋 REGULATORY REPORTING (Using Scheme Metrics)');
    console.log('-'.repeat(60));

    // AUM and flow analysis using scheme daily metrics
    console.log('💼 Fund Flow and AUM Analysis:');
    const regulatoryStart = performance.now();
    
    const fundFlows = await this.client.query(`
      SELECT 
        scheme_id,
        SUM(gross_inflows) as total_inflows,
        SUM(gross_outflows) as total_outflows,
        SUM(net_flows) as total_net_flows,
        AVG(unique_investors) as avg_investors,
        COUNT(DISTINCT day) as active_days
      FROM scheme_daily_metrics
      WHERE day >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY scheme_id
      HAVING SUM(gross_inflows) > 0 OR SUM(gross_outflows) > 0
      ORDER BY total_net_flows DESC
      LIMIT 10
    `);
    
    const regulatoryEnd = performance.now();
    console.log(`   ⚡ Query Time: ${(regulatoryEnd - regulatoryStart).toFixed(2)}ms`);
    
    fundFlows.rows.forEach(row => {
      const inflows = parseFloat(row.total_inflows);
      const outflows = parseFloat(row.total_outflows);
      const netFlows = parseFloat(row.total_net_flows);
      const avgInvestors = parseFloat(row.avg_investors);
      
      console.log(`   🏛️ Scheme ${row.scheme_id}:`);
      console.log(`      💚 Inflows: ₹${inflows.toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
      console.log(`      💔 Outflows: ₹${outflows.toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
      console.log(`      🌊 Net Flow: ₹${netFlows.toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
      console.log(`      👥 Avg Investors: ${avgInvestors.toFixed(1)}, Active Days: ${row.active_days}`);
      console.log('');
    });
  }

  async comparePerformance() {
    console.log('\n🏁 PERFORMANCE COMPARISON: Continuous Aggregates vs Raw Queries');
    console.log('-'.repeat(60));

    // Compare query performance
    console.log('⚡ Query Performance Comparison:');
    
    // Test 1: Daily summary (Continuous Aggregate)
    const start1 = performance.now();
    await this.client.query(`
      SELECT day, total_transactions, total_volume, active_customers
      FROM daily_metrics 
      ORDER BY day DESC 
      LIMIT 7
    `);
    const end1 = performance.now();
    
    // Test 2: Same query on raw data (if we had enough data)
    const start2 = performance.now();
    await this.client.query(`
      SELECT 
        DATE(transaction_date) as day,
        COUNT(*) as total_transactions,
        SUM(amount) as total_volume,
        COUNT(DISTINCT customer_id) as active_customers
      FROM transactions 
      WHERE transaction_date >= CURRENT_DATE - INTERVAL '7 days'
        AND cams_status = 'PROCESSED'
      GROUP BY DATE(transaction_date)
      ORDER BY day DESC
    `);
    const end2 = performance.now();
    
    console.log(`   📊 Continuous Aggregate Query: ${(end1 - start1).toFixed(2)}ms`);
    console.log(`   📊 Raw Transaction Query: ${(end2 - start2).toFixed(2)}ms`);
    console.log(`   🚀 Performance Improvement: ${((end2 - start2) / (end1 - start1)).toFixed(1)}x faster`);
    console.log('');
    
    console.log('💡 Expected Performance at Scale:');
    console.log('   📈 With 1M transactions:');
    console.log('      ⚡ Continuous Aggregates: <1ms');
    console.log('      🐌 Raw Queries: 50-200ms');
    console.log('   📈 With 10M transactions:');
    console.log('      ⚡ Continuous Aggregates: <1ms');
    console.log('      🐌 Raw Queries: 500-2000ms');
    console.log('   📈 With 100M transactions:');
    console.log('      ⚡ Continuous Aggregates: <1ms');
    console.log('      🐌 Raw Queries: 5-20 seconds');
    console.log('');
  }
}

// Main execution
async function main() {
  const demo = new FinancialAnalyticsDemo();
  await demo.runFinancialDemo();
  
  console.log('\n💡 CONTINUOUS AGGREGATES BENEFITS FOR AMC OPERATIONS');
  console.log('='.repeat(80));
  console.log('');
  console.log('🏦 Real-time Dashboard Benefits:');
  console.log('   • Sub-millisecond KPI queries for management dashboards');
  console.log('   • Instant customer portfolio summaries');
  console.log('   • Real-time fund performance tracking');
  console.log('   • Live operational monitoring');
  console.log('');
  console.log('📊 Analytics Benefits:');
  console.log('   • Fast risk analysis and concentration monitoring');
  console.log('   • Instant regulatory reporting (AUM, flows, compliance)');
  console.log('   • Real-time liquidity pattern analysis');
  console.log('   • Portfolio evolution tracking');
  console.log('');
  console.log('🚀 Technical Benefits:');
  console.log('   • Automatic incremental updates');
  console.log('   • Background refresh (no impact on operations)');
  console.log('   • Compression of materialized data');
  console.log('   • Perfect for high-frequency trading systems');
  console.log('');
  console.log('💰 Business Benefits:');
  console.log('   • Real-time decision making capability');
  console.log('   • Reduced server costs (faster queries = less CPU)');
  console.log('   • Better customer experience (instant responses)');
  console.log('   • Scalable to enterprise-level operations');
  console.log('='.repeat(80));
}

main().catch(console.error); 