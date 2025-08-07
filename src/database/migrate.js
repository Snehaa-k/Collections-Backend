require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const db = require('./connection');
const logger = require('../utils/logger');

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Split schema into individual statements (handle functions properly)
    const statements = [];
    let currentStatement = '';
    let inFunction = false;
    
    const lines = schema.split('\n');
    
    for (const line of lines) {
      currentStatement += line + '\n';
      
      // Check if we're entering a function
      if (line.includes('$func$') && !inFunction) {
        inFunction = true;
      }
      // Check if we're exiting a function
      else if (line.includes('$func$') && inFunction) {
        inFunction = false;
      }
      // If we hit a semicolon and we're not in a function, end the statement
      else if (line.trim().endsWith(';') && !inFunction) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // Filter out empty statements
    const validStatements = statements.filter(stmt => stmt.length > 0 && !stmt.match(/^\s*--/));
    
    for (const statement of validStatements) {
      try {
        await db.query(statement);
        logger.info(`Executed: ${statement.substring(0, 50)}...`);
      } catch (error) {
        logger.error(`Failed to execute statement: ${statement.substring(0, 50)}...`, error);
        throw error;
      }
    }
    
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;