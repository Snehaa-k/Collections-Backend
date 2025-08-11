require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const db = require('./connection');
const logger = require('../utils/logger');

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    
    // Check if tables already exist
    const tablesExist = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tablesExist.rows[0].exists) {
      logger.info('Tables already exist, skipping migrations');
      return;
    }
    
    const schemaPath = path.join(__dirname, 'schema-simple.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Execute the entire schema as one statement
    await db.query(schema);
    logger.info('Database migrations completed successfully');
    
    // Add triggers separately if needed
    await addTriggers();
    
  } catch (error) {
    logger.error('Migration failed:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  } finally {
    if (require.main === module) {
      await db.close();
    }
  }
}

async function addTriggers() {
  try {
    // Create function
    await db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create triggers
    await db.query(`
      CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await db.query(`
      CREATE TRIGGER update_accounts_updated_at 
      BEFORE UPDATE ON accounts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    logger.info('Triggers created successfully');
  } catch (error) {
    logger.warn('Trigger creation failed (non-critical):', error.message);
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;