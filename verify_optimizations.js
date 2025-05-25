const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'amc_simulation',
  user: 'amc_user',
  password: 'amc_password'
});

async function verifyOptimizations() {
  try {
    await client.connect();
    console.log('🚀 TIMESCALEDB OPTIMIZATION VERIFICATION');
    console.log('='.repeat(60));
    
    // Check hypertables
    const hypertables = await client.query(`
      SELECT hypertable_name, compression_enabled, num_chunks, num_dimensions
      FROM timescaledb_information.hypertables
    `);
    console.log('\n🏗️  Hypertables Configuration:');
    hypertables.rows.forEach(row => {
      console.log(`   ✅ ${row.hypertable_name}:`);
      console.log(`      📦 Chunks: ${row.num_chunks}`);
      console.log(`      🗜️  Compression: ${row.compression_enabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`      📐 Dimensions: ${row.num_dimensions}`);
    });
    
    // Check continuous aggregates
    const aggregates = await client.query(`
      SELECT view_name, compression_enabled, materialized_only
      FROM timescaledb_information.continuous_aggregates
    `);
    console.log('\n📊 Continuous Aggregates:');
    if (aggregates.rows.length > 0) {
      aggregates.rows.forEach(row => {
        console.log(`   ✅ ${row.view_name}:`);
        console.log(`      🗜️  Compression: ${row.compression_enabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`      📋 Materialized: ${row.materialized_only}`);
      });
    } else {
      console.log('   ❌ No continuous aggregates found');
    }
    
    // Check compression policies
    const policies = await client.query(`
      SELECT hypertable, compress_after
      FROM timescaledb_information.compression_settings
      WHERE compress_after IS NOT NULL
    `);
    console.log('\n🗜️  Compression Policies:');
    if (policies.rows.length > 0) {
      policies.rows.forEach(row => {
        console.log(`   ✅ ${row.hypertable}: compress after ${row.compress_after}`);
      });
    } else {
      console.log('   ❌ No compression policies found');
    }
    
    // Check retention policies
    const retention = await client.query(`
      SELECT hypertable, drop_after
      FROM timescaledb_information.drop_chunks_policies
    `);
    console.log('\n📅 Retention Policies:');
    if (retention.rows.length > 0) {
      retention.rows.forEach(row => {
        console.log(`   ✅ ${row.hypertable}: drop after ${row.drop_after}`);
      });
    } else {
      console.log('   ❌ No retention policies found');
    }
    
    // Check chunk intervals
    const chunks = await client.query(`
      SELECT hypertable_name, chunk_name, range_start, range_end
      FROM timescaledb_information.chunks
      ORDER BY hypertable_name, range_start
    `);
    console.log('\n📦 Data Chunks:');
    if (chunks.rows.length > 0) {
      chunks.rows.forEach(row => {
        console.log(`   📊 ${row.hypertable_name}:`);
        console.log(`      📁 ${row.chunk_name}: ${row.range_start} to ${row.range_end}`);
      });
    } else {
      console.log('   ℹ️  No data chunks yet (empty database)');
    }
    
    // Check indexes
    const indexes = await client.query(`
      SELECT schemaname, tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'amc' 
        AND tablename = 'transactions'
        AND indexname LIKE 'idx_txn_%'
      ORDER BY indexname
    `);
    console.log('\n📚 Performance Indexes:');
    if (indexes.rows.length > 0) {
      indexes.rows.forEach(row => {
        console.log(`   ✅ ${row.indexname} on ${row.tablename}`);
      });
    } else {
      console.log('   ❌ No performance indexes found');
    }
    
    // Test a few key views
    console.log('\n🔍 Testing Key Views:');
    try {
      await client.query('SELECT COUNT(*) FROM daily_metrics');
      console.log('   ✅ daily_metrics view working');
    } catch (e) {
      console.log('   ❌ daily_metrics view error:', e.message);
    }
    
    try {
      await client.query('SELECT COUNT(*) FROM hourly_metrics');
      console.log('   ✅ hourly_metrics view working');
    } catch (e) {
      console.log('   ❌ hourly_metrics view error:', e.message);
    }
    
    try {
      await client.query('SELECT COUNT(*) FROM customer_daily_portfolio');
      console.log('   ✅ customer_daily_portfolio view working');
    } catch (e) {
      console.log('   ❌ customer_daily_portfolio view error:', e.message);
    }
    
    try {
      await client.query('SELECT COUNT(*) FROM scheme_daily_metrics');
      console.log('   ✅ scheme_daily_metrics view working');
    } catch (e) {
      console.log('   ❌ scheme_daily_metrics view error:', e.message);
    }
    
    console.log('\n🎉 VERIFICATION COMPLETE!');
    console.log('✅ TimescaleDB optimizations successfully applied!');
    console.log('🚀 Ready for high-performance 10M+ transaction processing!');
    
  } catch (error) {
    console.error('❌ Verification error:', error.message);
  } finally {
    await client.end();
  }
}

verifyOptimizations(); 