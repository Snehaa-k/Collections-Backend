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

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;