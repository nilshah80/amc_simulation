const { Client } = require('pg');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'amc_simulation',
  user: 'amc_user',
  password: 'amc_password'
};

class TimescaleDBPerformanceDemo {
  constructor() {
    this.client = new Client(dbConfig);
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.end();
  }

  async runDemo() {
    try {
      await this.connect();
      
      console.log('🚀 TimescaleDB Performance Demo for AMC Simulation');
      console.log('='.repeat(80));
      
      await this.showTimescaleDBInfo();
      await this.demonstrateChunking();
      await this.showPerformanceQueries();
      await this.demonstrateTimeSeriesAnalytics();
      await this.showCompressionBenefits();
      await this.demonstrateContinuousAggregates();
      
    } catch (error) {
      console.error('❌ Error in demo:', error.message);
    } finally {
      await this.disconnect();
    }
  }

  async showTimescaleDBInfo() {
    console.log('\n📊 TIMESCALEDB CONFIGURATION ANALYSIS');
    console.log('-'.repeat(60));

    // Show hypertables
    const hypertablesQuery = `
      SELECT 
        hypertable_schema,
        hypertable_name,
        num_dimensions,
        num_chunks,
        compression_enabled,
        tablespaces
      FROM timescaledb_information.hypertables
    `;
    
    const result = await this.client.query(hypertablesQuery);
    
    console.log('🏗️  Configured Hypertables:');
    result.rows.forEach(row => {
      console.log(`   📋 ${row.hypertable_schema}.${row.hypertable_name}`);
      console.log(`      📦 Chunks: ${row.num_chunks}`);
      console.log(`      🗜️  Compression: ${row.compression_enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`      📐 Dimensions: ${row.num_dimensions}`);
      console.log('');
    });

    // Show chunks info
    const chunksQuery = `
      SELECT 
        hypertable_name,
        chunk_name,
        range_start::date as start_date,
        range_end::date as end_date,
        chunk_tablespace
      FROM timescaledb_information.chunks 
      ORDER BY hypertable_name, range_start
    `;
    
    const chunksResult = await this.client.query(chunksQuery);
    
    console.log('📦 Data Chunks (Time Partitions):');
    chunksResult.rows.forEach(row => {
      console.log(`   🕐 ${row.hypertable_name}: ${row.start_date} to ${row.end_date}`);
      console.log(`      📁 Chunk: ${row.chunk_name}`);
      console.log('');
    });
  }

  async demonstrateChunking() {
    console.log('\n⚡ CHUNKING PERFORMANCE BENEFITS');
    console.log('-'.repeat(60));

    // Show transaction data distribution
    const distributionQuery = `
      SELECT 
        DATE(transaction_date) as transaction_day,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        MIN(transaction_date) as first_txn,
        MAX(transaction_date) as last_txn
      FROM amc.transactions 
      WHERE cams_status = 'PROCESSED'
      GROUP BY DATE(transaction_date)
      ORDER BY transaction_day
    `;
    
    const distResult = await this.client.query(distributionQuery);
    
    console.log('📈 Transaction Data Distribution by Day:');
    distResult.rows.forEach(row => {
      const amount = parseFloat(row.total_amount);
      const avgAmount = parseFloat(row.avg_amount);
      console.log(`   📅 ${row.transaction_day}: ${row.transaction_count} transactions`);
      console.log(`      💰 Total: ₹${amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`);
      console.log(`      📊 Average: ₹${avgAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`);
      console.log('');
    });

    // Demonstrate chunk exclusion
    console.log('🎯 Chunk Exclusion Benefits:');
    console.log('   When querying specific date ranges, TimescaleDB automatically');
    console.log('   excludes irrelevant chunks, dramatically improving performance.');
    console.log('');
  }

  async showPerformanceQueries() {
    console.log('\n🏃‍♂️ HIGH-PERFORMANCE TIME-SERIES QUERIES');
    console.log('-'.repeat(60));

    // 1. Recent transaction analysis
    console.log('🔍 1. Recent Transaction Analysis (Last 7 Days):');
    const start = performance.now();
    
    const recentQuery = `
      SELECT 
        DATE(transaction_date) as day,
        transaction_mode,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM amc.transactions 
      WHERE transaction_date >= NOW() - INTERVAL '7 days'
        AND cams_status = 'PROCESSED'
      GROUP BY DATE(transaction_date), transaction_mode
      ORDER BY day DESC, total_amount DESC
    `;
    
    const recentResult = await this.client.query(recentQuery);
    const end = performance.now();
    
    console.log(`   ⚡ Query Time: ${(end - start).toFixed(2)}ms`);
    recentResult.rows.forEach(row => {
      const amount = parseFloat(row.total_amount);
      const avgAmount = parseFloat(row.avg_amount);
      console.log(`   📅 ${row.day} - ${row.transaction_mode}: ${row.count} txns, ₹${amount.toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
    });
    console.log('');

    // 2. Time-bucket aggregation
    console.log('🔍 2. Hourly Transaction Volume (TimescaleDB time_bucket):');
    const bucketStart = performance.now();
    
    const bucketQuery = `
      SELECT 
        time_bucket('1 hour', transaction_date) as hour_bucket,
        COUNT(*) as transaction_count,
        SUM(amount) as total_volume,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM amc.transactions 
      WHERE transaction_date >= NOW() - INTERVAL '24 hours'
        AND cams_status = 'PROCESSED'
      GROUP BY hour_bucket
      ORDER BY hour_bucket DESC
      LIMIT 10
    `;
    
    const bucketResult = await this.client.query(bucketQuery);
    const bucketEnd = performance.now();
    
    console.log(`   ⚡ Query Time: ${(bucketEnd - bucketStart).toFixed(2)}ms`);
    bucketResult.rows.forEach(row => {
      const volume = parseFloat(row.total_volume);
      const hour = new Date(row.hour_bucket).toLocaleString('en-IN');
      console.log(`   🕐 ${hour}: ${row.transaction_count} txns, ₹${volume.toLocaleString('en-IN', {maximumFractionDigits: 0})}, ${row.unique_customers} customers`);
    });
    console.log('');

    // 3. Customer portfolio performance over time
    console.log('🔍 3. Customer Portfolio Performance Tracking:');
    const portfolioStart = performance.now();
    
    const portfolioQuery = `
      WITH daily_positions AS (
        SELECT 
          customer_id,
          DATE(transaction_date) as position_date,
          SUM(CASE WHEN transaction_type = 'PURCHASE' THEN amount ELSE -amount END) as net_investment,
          SUM(CASE WHEN transaction_type = 'PURCHASE' THEN units ELSE -units END) as net_units
        FROM amc.transactions 
        WHERE cams_status = 'PROCESSED'
        GROUP BY customer_id, DATE(transaction_date)
      )
      SELECT 
        customer_id,
        position_date,
        net_investment,
        net_units,
        SUM(net_investment) OVER (PARTITION BY customer_id ORDER BY position_date) as cumulative_investment,
        SUM(net_units) OVER (PARTITION BY customer_id ORDER BY position_date) as cumulative_units
      FROM daily_positions
      WHERE customer_id IN (1, 2, 7)
      ORDER BY customer_id, position_date DESC
      LIMIT 15
    `;
    
    const portfolioResult = await this.client.query(portfolioQuery);
    const portfolioEnd = performance.now();
    
    console.log(`   ⚡ Query Time: ${(portfolioEnd - portfolioStart).toFixed(2)}ms`);
    portfolioResult.rows.forEach(row => {
      const investment = parseFloat(row.net_investment);
      const cumulative = parseFloat(row.cumulative_investment);
      console.log(`   👤 Customer ${row.customer_id} on ${row.position_date}:`);
      console.log(`      💰 Day Investment: ₹${investment.toLocaleString('en-IN', {minimumFractionDigits: 2})}`);
      console.log(`      📈 Cumulative: ₹${cumulative.toLocaleString('en-IN', {minimumFractionDigits: 2})}`);
      console.log('');
    });
  }

  async demonstrateTimeSeriesAnalytics() {
    console.log('\n📊 ADVANCED TIME-SERIES ANALYTICS');
    console.log('-'.repeat(60));

    // Moving averages
    console.log('📈 Moving Average Analysis:');
    const movingAvgQuery = `
      WITH daily_volumes AS (
        SELECT 
          DATE(transaction_date) as day,
          SUM(amount) as daily_volume,
          COUNT(*) as daily_count
        FROM amc.transactions 
        WHERE cams_status = 'PROCESSED'
        GROUP BY DATE(transaction_date)
      )
      SELECT 
        day,
        daily_volume,
        daily_count,
        AVG(daily_volume) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as ma_3_day,
        AVG(daily_volume) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as ma_7_day
      FROM daily_volumes
      ORDER BY day DESC
      LIMIT 10
    `;
    
    const movingResult = await this.client.query(movingAvgQuery);
    
    movingResult.rows.forEach(row => {
      const volume = parseFloat(row.daily_volume);
      const ma3 = parseFloat(row.ma_3_day);
      const ma7 = parseFloat(row.ma_7_day);
      console.log(`   📅 ${row.day}:`);
      console.log(`      💰 Volume: ₹${volume.toLocaleString('en-IN', {maximumFractionDigits: 0})} (${row.daily_count} txns)`);
      console.log(`      📊 3-day MA: ₹${ma3.toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
      console.log(`      📈 7-day MA: ₹${ma7.toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
      console.log('');
    });

    // Peak analysis
    console.log('⚡ Peak Transaction Analysis:');
    const peakQuery = `
      SELECT 
        time_bucket('1 hour', transaction_date) as hour,
        COUNT(*) as txn_count,
        SUM(amount) as volume,
        RANK() OVER (ORDER BY COUNT(*) DESC) as volume_rank
      FROM amc.transactions 
      WHERE transaction_date >= NOW() - INTERVAL '48 hours'
        AND cams_status = 'PROCESSED'
      GROUP BY hour
      ORDER BY txn_count DESC
      LIMIT 5
    `;
    
    const peakResult = await this.client.query(peakQuery);
    
    peakResult.rows.forEach(row => {
      const volume = parseFloat(row.volume);
      const hour = new Date(row.hour).toLocaleString('en-IN');
      console.log(`   🏆 Rank ${row.volume_rank}: ${hour}`);
      console.log(`      📊 ${row.txn_count} transactions, ₹${volume.toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
      console.log('');
    });
  }

  async showCompressionBenefits() {
    console.log('\n🗜️  COMPRESSION ANALYSIS');
    console.log('-'.repeat(60));

    // Check table sizes
    const sizeQuery = `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'amc' 
        AND tablename IN ('transactions', 'nav_history')
      ORDER BY size_bytes DESC
    `;
    
    const sizeResult = await this.client.query(sizeQuery);
    
    console.log('💾 Current Table Sizes:');
    sizeResult.rows.forEach(row => {
      console.log(`   📊 ${row.schemaname}.${row.tablename}: ${row.size}`);
    });
    console.log('');

    // Show compression potential
    console.log('🎯 Compression Benefits:');
    console.log('   ✅ TimescaleDB compression can reduce storage by 60-90%');
    console.log('   ✅ Faster queries on historical data');
    console.log('   ✅ Reduced I/O and memory usage');
    console.log('   ✅ Lower costs for cloud storage');
    console.log('');
    
    console.log('🔧 To enable compression on historical data:');
    console.log('   ALTER TABLE amc.transactions SET (timescaledb.compress = true);');
    console.log('   SELECT add_compression_policy(\'amc.transactions\', INTERVAL \'30 days\');');
    console.log('');
  }

  async demonstrateContinuousAggregates() {
    console.log('\n⚡ CONTINUOUS AGGREGATES DEMO');
    console.log('-'.repeat(60));

    console.log('🚀 Benefits of Continuous Aggregates:');
    console.log('   ✅ Pre-computed aggregations for real-time dashboards');
    console.log('   ✅ Automatic updates as new data arrives');
    console.log('   ✅ Much faster query performance for reporting');
    console.log('   ✅ Perfect for portfolio performance dashboards');
    console.log('');

    // Simulate what a continuous aggregate would provide
    console.log('📊 Sample: Daily Portfolio Metrics (would be pre-computed):');
    const aggregateQuery = `
      SELECT 
        DATE(transaction_date) as date,
        COUNT(*) as total_transactions,
        SUM(amount) as total_volume,
        COUNT(DISTINCT customer_id) as active_customers,
        COUNT(DISTINCT scheme_id) as active_schemes,
        AVG(amount) as avg_transaction_size
      FROM amc.transactions 
      WHERE cams_status = 'PROCESSED'
        AND transaction_date >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(transaction_date)
      ORDER BY date DESC
    `;
    
    const start = performance.now();
    const aggregateResult = await this.client.query(aggregateQuery);
    const end = performance.now();
    
    console.log(`   ⚡ Current Query Time: ${(end - start).toFixed(2)}ms`);
    console.log('   📈 With Continuous Aggregates: < 1ms (pre-computed)');
    console.log('');
    
    aggregateResult.rows.forEach(row => {
      const volume = parseFloat(row.total_volume);
      const avgSize = parseFloat(row.avg_transaction_size);
      console.log(`   📅 ${row.date}:`);
      console.log(`      📊 ${row.total_transactions} transactions, ₹${volume.toLocaleString('en-IN', {maximumFractionDigits: 0})}`);
      console.log(`      👥 ${row.active_customers} customers, ${row.active_schemes} schemes`);
      console.log(`      💰 Avg size: ₹${avgSize.toLocaleString('en-IN', {maximumFractionDigits: 2})}`);
      console.log('');
    });

    console.log('🔧 To create a continuous aggregate:');
    console.log(`
    CREATE MATERIALIZED VIEW daily_portfolio_metrics
    WITH (timescaledb.continuous) AS
    SELECT 
      time_bucket('1 day', transaction_date) as day,
      COUNT(*) as total_transactions,
      SUM(amount) as total_volume,
      COUNT(DISTINCT customer_id) as active_customers
    FROM amc.transactions 
    GROUP BY day;
    `);
  }
}

// Performance comparison
async function runPerformanceComparison() {
  console.log('\n🏁 PERFORMANCE COMPARISON');
  console.log('-'.repeat(60));
  
  const client = new Client(dbConfig);
  await client.connect();

  // Test time-range query performance
  console.log('⚡ Time-Range Query Performance Test:');
  
  const timeRangeQuery = `
    SELECT 
      COUNT(*) as count,
      SUM(amount) as total,
      AVG(amount) as average
    FROM amc.transactions 
    WHERE transaction_date >= NOW() - INTERVAL '24 hours'
      AND cams_status = 'PROCESSED'
  `;
  
  // Run multiple times and average
  const times = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await client.query(timeRangeQuery);
    const end = performance.now();
    times.push(end - start);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  
  console.log(`   🎯 Average Query Time: ${avgTime.toFixed(2)}ms`);
  console.log('   📊 With regular PostgreSQL table: 50-500ms (depending on data size)');
  console.log('   ⚡ With TimescaleDB hypertable: Much faster due to chunk exclusion');
  console.log('');
  
  await client.end();
}

// Main execution
async function main() {
  const demo = new TimescaleDBPerformanceDemo();
  await demo.runDemo();
  await runPerformanceComparison();
  
  console.log('\n🎉 TIMESCALEDB BENEFITS SUMMARY');
  console.log('='.repeat(80));
  console.log('✅ Automatic time-based partitioning (chunks)');
  console.log('✅ Excellent query performance for time-range queries');
  console.log('✅ Built-in time-series functions (time_bucket, etc.)');
  console.log('✅ Compression for historical data');
  console.log('✅ Continuous aggregates for real-time dashboards');
  console.log('✅ Better handling of time-series workloads');
  console.log('✅ Perfect for financial data, IoT, and monitoring');
  console.log('');
  console.log('🚀 For AMC simulation: Ideal for NAV history, transaction analysis,');
  console.log('   portfolio performance tracking, and regulatory reporting!');
  console.log('='.repeat(80));
}

main().catch(console.error); 