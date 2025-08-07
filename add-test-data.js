require('dotenv').config();
const db = require('./src/database/connection');

async function addTestData() {
  try {
    console.log('🔍 Adding test accounts...');

    // Add some test accounts
    const testAccounts = [
      {
        account_number: 'ACC001',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '+1234567890',
        balance: 1500.50,
        status: 'active',
        created_by: 1
      },
      {
        account_number: 'ACC002', 
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        customer_phone: '+1234567891',
        balance: 2750.00,
        status: 'active',
        created_by: 1
      },
      {
        account_number: 'ACC003',
        customer_name: 'Bob Johnson',
        customer_email: 'bob@example.com',
        customer_phone: '+1234567892',
        balance: 500.25,
        status: 'inactive',
        created_by: 1
      }
    ];

    for (const account of testAccounts) {
      await db.query(
        `INSERT INTO accounts (account_number, customer_name, customer_email, customer_phone, balance, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (account_number) DO NOTHING`,
        [account.account_number, account.customer_name, account.customer_email, 
         account.customer_phone, account.balance, account.status, account.created_by]
      );
    }

    console.log('✅ Test accounts added successfully!');
    
    // Check total accounts
    const count = await db.query('SELECT COUNT(*) as count FROM accounts');
    console.log(`📊 Total accounts in database: ${count.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    await db.close();
  }
}

addTestData();