require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./connection');
const logger = require('../utils/logger');

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123!', 12);
    await db.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
      ['admin@collections.com', adminPassword, 'admin']
    );

    // Create test users
    const testUsers = [
      { email: 'manager@collections.com', role: 'manager' },
      { email: 'agent1@collections.com', role: 'agent' },
      { email: 'agent2@collections.com', role: 'agent' },
      { email: 'viewer@collections.com', role: 'viewer' }
    ];

    for (const user of testUsers) {
      const password = await bcrypt.hash('password123!', 12);
      await db.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
        [user.email, password, user.role]
      );
    }

    // Generate sample accounts
    logger.info('Generating sample accounts...');
    const accountCount = process.env.SEED_ACCOUNT_COUNT || 1000;
    
    for (let i = 1; i <= accountCount; i++) {
      const accountNumber = `ACC${String(i).padStart(6, '0')}`;
      const customerName = `Customer ${i}`;
      const customerEmail = `customer${i}@example.com`;
      const customerPhone = `+1${String(Math.floor(Math.random() * 9000000000) + 1000000000)}`;
      const balance = Math.floor(Math.random() * 10000) + 100;
      const status = ['active', 'inactive'][Math.floor(Math.random() * 2)];
      
      await db.query(
        `INSERT INTO accounts (account_number, customer_name, customer_email, customer_phone, balance, status, created_by, assigned_agent)
         VALUES ($1, $2, $3, $4, $5, $6, 1, $7) ON CONFLICT (account_number) DO NOTHING`,
        [accountNumber, customerName, customerEmail, customerPhone, balance, status, Math.floor(Math.random() * 2) + 2]
      );

      if (i % 100 === 0) {
        logger.info(`Created ${i} accounts...`);
      }
    }

    // Generate sample payments
    logger.info('Generating sample payments...');
    const accountsResult = await db.query('SELECT id FROM accounts LIMIT 100');
    const accountIds = accountsResult.rows.map(row => row.id);
    
    for (let i = 0; i < 200; i++) {
      const accountId = accountIds[Math.floor(Math.random() * accountIds.length)];
      const amount = (Math.random() * 1000 + 50).toFixed(2);
      const paymentMethod = ['credit_card', 'bank_transfer', 'cash'][Math.floor(Math.random() * 3)];
      const status = ['completed', 'pending'][Math.floor(Math.random() * 2)];
      
      await db.query(
        'INSERT INTO payments (account_id, amount, payment_method, status, processed_by) VALUES ($1, $2, $3, $4, $5)',
        [accountId, amount, paymentMethod, status, 1]
      );
    }
    
    // Generate sample activities
    logger.info('Generating sample activities...');
    const activityTypes = ['phone_call', 'email_sent', 'payment_reminder', 'account_review'];
    
    for (let i = 0; i < 500; i++) {
      const accountId = accountIds[Math.floor(Math.random() * accountIds.length)];
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const description = `${activityType.replace('_', ' ')} activity for account`;
      
      await db.query(
        'INSERT INTO activities (account_id, user_id, activity_type, description) VALUES ($1, $2, $3, $4)',
        [accountId, Math.floor(Math.random() * 2) + 2, activityType, description]
      );
    }

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Seeding failed:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  } finally {
    // Don't close the database connection when called from server startup
    if (require.main === module) {
      await db.close();
    }
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;