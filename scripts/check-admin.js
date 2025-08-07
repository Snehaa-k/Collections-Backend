const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'collections_db',
  user: 'postgres',
  password: 'sree@123'
});

async function checkAdmin() {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@test.com']);
    
    if (result.rows.length > 0) {
      console.log('Admin user details:', result.rows[0]);
      
      // Update to ensure is_active is true
      await pool.query('UPDATE users SET is_active = true WHERE email = $1', ['admin@test.com']);
      console.log('Updated admin user to active');
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkAdmin();