const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'collections_db',
  user: 'postgres',
  password: 'sree@123'
});

async function updateAdminPassword() {
  try {
    // Hash new password
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    // Update admin password and reset attempts
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL WHERE email = $2 RETURNING email, role, is_active',
      [passwordHash, 'admin@test.com']
    );

    console.log('Admin password updated:', result.rows[0]);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

updateAdminPassword();