require('dotenv').config();
const db = require('../src/database/connection');
const logger = require('../src/utils/logger');

async function generateTestData() {
  console.log('🚀 Starting test data generation...');
  
  try {
    // Generate 100,000 test accounts
    console.log('📊 Generating 100,000 test accounts...');
    await generateAccounts(100000);
    
    // Generate test payments
    console.log('💰 Generating test payments...');
    await generatePayments(50000);
    
    // Generate test activities
    console.log('📝 Generating test activities...');
    await generateActivities(200000);
    
    console.log('✅ Test data generation completed!');
    await showStatistics();
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
  } finally {
    await db.close();
  }
}

async function generateAccounts(count) {
  const batchSize = 1000;
  const batches = Math.ceil(count / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const accounts = [];
    const currentBatchSize = Math.min(batchSize, count - (batch * batchSize));
    
    for (let i = 0; i < currentBatchSize; i++) {
      const accountNumber = `ACC${String(batch * batchSize + i + 1).padStart(8, '0')}`;
      const customerName = `Customer ${batch * batchSize + i + 1}`;
      const customerEmail = `customer${batch * batchSize + i + 1}@example.com`;
      const balance = Math.floor(Math.random() * 10000) + 100;
      const status = ['active', 'inactive', 'closed'][Math.floor(Math.random() * 3)];
      
      accounts.push([accountNumber, customerName, customerEmail, balance, status, 1]);
    }
    
    const values = accounts.map((_, index) => 
      `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`
    ).join(',');
    
    const query = `
      INSERT INTO accounts (account_number, customer_name, customer_email, balance, status, created_by)
      VALUES ${values}
      ON CONFLICT (account_number) DO NOTHING
    `;
    
    await db.query(query, accounts.flat());
    
    if ((batch + 1) % 10 === 0) {
      console.log(`   Generated ${(batch + 1) * batchSize} accounts...`);
    }
  }
}

async function generatePayments(count) {
  const accountsResult = await db.query('SELECT id FROM accounts LIMIT 10000');
  const accountIds = accountsResult.rows.map(row => row.id);
  
  const batchSize = 1000;
  const batches = Math.ceil(count / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const payments = [];
    const currentBatchSize = Math.min(batchSize, count - (batch * batchSize));
    
    for (let i = 0; i < currentBatchSize; i++) {
      const accountId = accountIds[Math.floor(Math.random() * accountIds.length)];
      const amount = (Math.random() * 1000 + 50).toFixed(2);
      const paymentMethod = ['credit_card', 'bank_transfer', 'cash'][Math.floor(Math.random() * 3)];
      const status = ['pending', 'completed', 'failed'][Math.floor(Math.random() * 3)];
      
      payments.push([accountId, amount, paymentMethod, status, 1]);
    }
    
    const values = payments.map((_, index) => 
      `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`
    ).join(',');
    
    const query = `
      INSERT INTO payments (account_id, amount, payment_method, status, processed_by)
      VALUES ${values}
    `;
    
    await db.query(query, payments.flat());
    
    if ((batch + 1) % 10 === 0) {
      console.log(`   Generated ${(batch + 1) * batchSize} payments...`);
    }
  }
}

async function generateActivities(count) {
  const accountsResult = await db.query('SELECT id FROM accounts LIMIT 10000');
  const accountIds = accountsResult.rows.map(row => row.id);
  
  const activityTypes = ['phone_call', 'email_sent', 'payment_reminder', 'account_review'];
  const batchSize = 1000;
  const batches = Math.ceil(count / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const activities = [];
    const currentBatchSize = Math.min(batchSize, count - (batch * batchSize));
    
    for (let i = 0; i < currentBatchSize; i++) {
      const accountId = accountIds[Math.floor(Math.random() * accountIds.length)];
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const description = `${activityType.replace('_', ' ')} activity for account ${accountId}`;
      
      activities.push([accountId, 1, activityType, description]);
    }
    
    const values = activities.map((_, index) => 
      `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`
    ).join(',');
    
    const query = `
      INSERT INTO activities (account_id, user_id, activity_type, description)
      VALUES ${values}
    `;
    
    await db.query(query, activities.flat());
    
    if ((batch + 1) % 20 === 0) {
      console.log(`   Generated ${(batch + 1) * batchSize} activities...`);
    }
  }
}

async function showStatistics() {
  console.log('\n📊 Database Statistics:');
  
  const stats = await Promise.all([
    db.query('SELECT COUNT(*) as count FROM accounts'),
    db.query('SELECT COUNT(*) as count FROM payments'),
    db.query('SELECT COUNT(*) as count FROM activities')
  ]);
  
  console.log(`📋 Accounts: ${stats[0].rows[0].count}`);
  console.log(`💰 Payments: ${stats[1].rows[0].count}`);
  console.log(`📝 Activities: ${stats[2].rows[0].count}`);
}

if (require.main === module) {
  generateTestData();
}

module.exports = generateTestData;