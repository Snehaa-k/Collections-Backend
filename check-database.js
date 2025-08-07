require('dotenv').config();
const db = require('./src/database/connection');

async function checkDatabase() {
  console.log('🔍 Checking Database Connection...\n');

  try {
    // Test connection
    const result = await db.query('SELECT NOW() as current_time');
    console.log('✅ Database connected:', result.rows[0].current_time);

    // Check tables exist
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables in database:');
    tables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // Check if we have any users
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n👥 Users in database: ${userCount.rows[0].count}`);

    // Check if we have any accounts
    const accountCount = await db.query('SELECT COUNT(*) as count FROM accounts');
    console.log(`📊 Accounts in database: ${accountCount.rows[0].count}`);

    console.log('\n🎉 Database check complete!');

  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your .env database credentials');
    console.log('3. Run: npm run migrate');
  } finally {
    await db.close();
  }
}

checkDatabase();