const cron = require('node-cron');
const logger = require('../utils/logger');
const Scheme = require('../models/Scheme');
const database = require('../config/database');

class ScheduledJobs {
  constructor() {
    this.jobs = {};
  }

  start() {
    logger.info('Starting scheduled jobs...');

    // Daily NAV history cleanup (keep last 5 years)
    this.jobs.navCleanup = cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldNAVHistory();
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    // Weekly transaction audit
    this.jobs.transactionAudit = cron.schedule('0 3 * * 0', async () => {
      await this.performTransactionAudit();
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    // Monthly portfolio reconciliation
    this.jobs.portfolioReconciliation = cron.schedule('0 4 1 * *', async () => {
      await this.performPortfolioReconciliation();
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    // Daily statistics generation
    this.jobs.dailyStats = cron.schedule('0 23 * * *', async () => {
      await this.generateDailyStatistics();
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    // Start all jobs
    Object.values(this.jobs).forEach(job => job.start());
    
    logger.info('All scheduled jobs started');
  }

  stop() {
    logger.info('Stopping scheduled jobs...');
    
    Object.values(this.jobs).forEach(job => job.stop());
    this.jobs = {};
    
    logger.info('All scheduled jobs stopped');
  }

  async cleanupOldNAVHistory() {
    try {
      logger.info('Starting NAV history cleanup...');
      
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      
      const query = `
        DELETE FROM nav_history 
        WHERE nav_date < $1
      `;
      
      const result = await database.query(query, [fiveYearsAgo.toISOString().split('T')[0]]);
      
      logger.info('NAV history cleanup completed', { 
        deletedRows: result.rowCount,
        cutoffDate: fiveYearsAgo.toISOString().split('T')[0]
      });
    } catch (error) {
      logger.error('Error in NAV history cleanup', error);
    }
  }

  async performTransactionAudit() {
    try {
      logger.info('Starting weekly transaction audit...');
      
      // Check for orphaned transactions
      const orphanedTransactionsQuery = `
        SELECT COUNT(*) as count
        FROM transactions t
        LEFT JOIN folios f ON t.folio_id = f.id
        WHERE f.id IS NULL
      `;
      
      const orphanedResult = await database.query(orphanedTransactionsQuery);
      const orphanedCount = parseInt(orphanedResult.rows[0].count);
      
      // Check for unprocessed transactions older than 1 day
      const staleTransactionsQuery = `
        SELECT COUNT(*) as count
        FROM transactions 
        WHERE status = 'SUBMITTED' 
        AND transaction_date < NOW() - INTERVAL '1 day'
      `;
      
      const staleResult = await database.query(staleTransactionsQuery);
      const staleCount = parseInt(staleResult.rows[0].count);
      
      // Check for holdings inconsistencies
      const holdingsInconsistencyQuery = `
        SELECT 
          h.folio_id,
          h.total_units,
          COALESCE(SUM(
            CASE 
              WHEN t.transaction_mode = 'REDEMPTION' THEN -t.units
              ELSE t.units
            END
          ), 0) as calculated_units
        FROM holdings h
        LEFT JOIN transactions t ON h.folio_id = t.folio_id AND t.status = 'PROCESSED'
        GROUP BY h.folio_id, h.total_units
        HAVING ABS(h.total_units - COALESCE(SUM(
          CASE 
            WHEN t.transaction_mode = 'REDEMPTION' THEN -t.units
            ELSE t.units
          END
        ), 0)) > 0.001
      `;
      
      const inconsistencyResult = await database.query(holdingsInconsistencyQuery);
      const inconsistencyCount = inconsistencyResult.rows.length;
      
      logger.info('Transaction audit completed', {
        orphanedTransactions: orphanedCount,
        staleTransactions: staleCount,
        holdingsInconsistencies: inconsistencyCount
      });
      
      // Log warnings if issues found
      if (orphanedCount > 0) {
        logger.warn(`Found ${orphanedCount} orphaned transactions`);
      }
      if (staleCount > 0) {
        logger.warn(`Found ${staleCount} stale unprocessed transactions`);
      }
      if (inconsistencyCount > 0) {
        logger.warn(`Found ${inconsistencyCount} holdings inconsistencies`);
      }
      
    } catch (error) {
      logger.error('Error in transaction audit', error);
    }
  }

  async performPortfolioReconciliation() {
    try {
      logger.info('Starting monthly portfolio reconciliation...');
      
      // Update all holdings current values
      const updateCurrentValuesQuery = `
        UPDATE holdings 
        SET current_value = holdings.total_units * s.nav,
            updated_at = CURRENT_TIMESTAMP
        FROM schemes s 
        WHERE holdings.scheme_id = s.id
      `;
      
      const updateResult = await database.query(updateCurrentValuesQuery);
      
      // Get portfolio summary
      const portfolioSummaryQuery = `
        SELECT 
          COUNT(DISTINCT c.id) as total_customers,
          COUNT(DISTINCT f.id) as total_folios,
          COUNT(DISTINCT h.id) as total_holdings,
          SUM(h.current_value) as total_aum,
          SUM(h.invested_amount) as total_invested
        FROM customers c
        JOIN folios f ON c.id = f.customer_id
        JOIN holdings h ON f.id = h.folio_id
        WHERE f.status = 'ACTIVE' AND h.total_units > 0
      `;
      
      const summaryResult = await database.query(portfolioSummaryQuery);
      const summary = summaryResult.rows[0];
      
      logger.info('Portfolio reconciliation completed', {
        updatedHoldings: updateResult.rowCount,
        totalCustomers: parseInt(summary.total_customers),
        totalFolios: parseInt(summary.total_folios),
        totalHoldings: parseInt(summary.total_holdings),
        totalAUM: parseFloat(summary.total_aum || 0),
        totalInvested: parseFloat(summary.total_invested || 0)
      });
      
    } catch (error) {
      logger.error('Error in portfolio reconciliation', error);
    }
  }

  async generateDailyStatistics() {
    try {
      logger.info('Generating daily statistics...');
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Transaction statistics
      const transactionStatsQuery = `
        SELECT 
          transaction_mode,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount
        FROM transactions 
        WHERE DATE(transaction_date) = $1
        GROUP BY transaction_mode
      `;
      
      const transactionStats = await database.query(transactionStatsQuery, [yesterday]);
      
      // SIP statistics
      const sipStatsQuery = `
        SELECT 
          COUNT(*) as executions,
          SUM(amount) as total_amount
        FROM transactions 
        WHERE DATE(transaction_date) = $1 AND transaction_mode = 'SIP'
      `;
      
      const sipStats = await database.query(sipStatsQuery, [yesterday]);
      
      // New customers/folios
      const newEntitiesQuery = `
        SELECT 
          (SELECT COUNT(*) FROM customers WHERE DATE(created_at) = $1) as new_customers,
          (SELECT COUNT(*) FROM folios WHERE DATE(created_at) = $1) as new_folios,
          (SELECT COUNT(*) FROM sip_registrations WHERE DATE(created_at) = $1) as new_sips
      `;
      
      const newEntities = await database.query(newEntitiesQuery, [yesterday]);
      
      // NAV changes
      const navChangesQuery = `
        SELECT 
          s.scheme_code,
          s.scheme_name,
          nh_yesterday.nav as yesterday_nav,
          nh_today.nav as today_nav,
          ((nh_today.nav - nh_yesterday.nav) / nh_yesterday.nav * 100) as change_percent
        FROM schemes s
        LEFT JOIN nav_history nh_yesterday ON s.id = nh_yesterday.scheme_id AND nh_yesterday.nav_date = $1
        LEFT JOIN nav_history nh_today ON s.id = nh_today.scheme_id AND nh_today.nav_date = $2
        WHERE nh_yesterday.nav IS NOT NULL AND nh_today.nav IS NOT NULL
        ORDER BY ABS(((nh_today.nav - nh_yesterday.nav) / nh_yesterday.nav * 100)) DESC
      `;
      
      const navChanges = await database.query(navChangesQuery, [yesterdayStr, today]);
      
      const dailyStats = {
        date: yesterday,
        transactions: transactionStats.rows,
        sipExecutions: sipStats.rows[0],
        newEntities: newEntities.rows[0],
        topNAVChanges: navChanges.rows.slice(0, 5)
      };
      
      logger.info('Daily statistics generated', dailyStats);
      
    } catch (error) {
      logger.error('Error generating daily statistics', error);
    }
  }

  // Method to manually trigger any job
  async runJob(jobName) {
    try {
      switch (jobName) {
        case 'navCleanup':
          await this.cleanupOldNAVHistory();
          break;
        case 'transactionAudit':
          await this.performTransactionAudit();
          break;
        case 'portfolioReconciliation':
          await this.performPortfolioReconciliation();
          break;
        case 'dailyStats':
          await this.generateDailyStatistics();
          break;
        default:
          throw new Error(`Unknown job: ${jobName}`);
      }
      
      logger.info(`Manually executed job: ${jobName}`);
    } catch (error) {
      logger.error(`Error running job ${jobName}`, error);
      throw error;
    }
  }

  getJobStatus() {
    return Object.keys(this.jobs).map(jobName => ({
      name: jobName,
      running: this.jobs[jobName] ? this.jobs[jobName].running : false,
      nextRun: this.jobs[jobName] ? this.jobs[jobName].nextDate() : null
    }));
  }
}

module.exports = new ScheduledJobs();
