const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'collections_db',
  user: 'postgres',
  password: 'sree@123'
});

async function createFreshAdmin() {
  try {
    // Delete existing admin
    await pool.query('DELETE FROM users WHERE email = $1', ['admin@test.com']);
    
    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    // Create fresh admin user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role, is_active, failed_login_attempts) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['admin@test.com', passwordHash, 'admin', true, 0]
    );

    console.log('Fresh admin user created:', result.rows[0]);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createFreshAdmin();