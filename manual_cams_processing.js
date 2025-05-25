const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'amc_simulation',
  user: 'amc_user',
  password: 'amc_password'
});

async function manualCamsProcessing() {
  try {
    await client.connect();
    
    console.log('🔄 MANUAL CAMS PROCESSING');
    console.log('='.repeat(50));
    
    // Get pending transactions
    const pendingTxns = await client.query(`
      SELECT id, customer_id, scheme_id, amount, transaction_type, units
      FROM amc.transactions 
      WHERE cams_status = 'PENDING'
      ORDER BY transaction_date ASC
      LIMIT 50000
    `);
    
    console.log(`📊 Found ${pendingTxns.rows.length} pending transactions`);
    
    if (pendingTxns.rows.length === 0) {
      console.log('No pending transactions to process');
      return;
    }
    
    // Process transactions in batches
    let processedCount = 0;
    
    for (const txn of pendingTxns.rows) {
      try {
        // Update transaction status to PROCESSED
        await client.query(`
          UPDATE amc.transactions 
          SET 
            cams_status = 'PROCESSED',
            updated_at = NOW()
          WHERE id = $1
        `, [txn.id]);
        
        processedCount++;
        
        if (processedCount % 10 === 0) {
          console.log(`   ✅ Processed ${processedCount} transactions...`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing transaction ${txn.id}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully processed ${processedCount} transactions`);
    
    // Check the results
    const processedCheck = await client.query(`
      SELECT 
        cams_status,
        COUNT(*) as count
      FROM amc.transactions
      GROUP BY cams_status
    `);
    
    console.log('\n📊 Transaction Status After Processing:');
    processedCheck.rows.forEach(row => {
      console.log(`   ${row.cams_status}: ${row.count} transactions`);
    });
    
    // Refresh materialized views manually
    console.log('\n🔄 Refreshing Continuous Aggregates...');
    
    try {
      // Refresh the continuous aggregates
      await client.query(`CALL refresh_continuous_aggregate('daily_metrics', NULL, NULL)`);
      console.log('   ✅ Refreshed daily_metrics');
    } catch (error) {
      console.log('   ⚠️ Could not refresh daily_metrics:', error.message);
    }
    
    try {
      await client.query(`CALL refresh_continuous_aggregate('hourly_metrics', NULL, NULL)`);
      console.log('   ✅ Refreshed hourly_metrics');
    } catch (error) {
      console.log('   ⚠️ Could not refresh hourly_metrics:', error.message);
    }
    
    try {
      await client.query(`CALL refresh_continuous_aggregate('customer_daily_portfolio', NULL, NULL)`);
      console.log('   ✅ Refreshed customer_daily_portfolio');
    } catch (error) {
      console.log('   ⚠️ Could not refresh customer_daily_portfolio:', error.message);
    }
    
    try {
      await client.query(`CALL refresh_continuous_aggregate('scheme_daily_metrics', NULL, NULL)`);
      console.log('   ✅ Refreshed scheme_daily_metrics');
    } catch (error) {
      console.log('   ⚠️ Could not refresh scheme_daily_metrics:', error.message);
    }
    
    console.log('\n🎯 Portfolio data should now be available!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

manualCamsProcessing(); 