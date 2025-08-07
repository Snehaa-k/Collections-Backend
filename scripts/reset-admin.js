const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'collections_db',
  user: 'postgres',
  password: 'sree@123'
});

async function resetAdmin() {
  try {
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = $1',
      ['admin@test.com']
    );
    console.log('Reset admin failed attempts');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

resetAdmin();