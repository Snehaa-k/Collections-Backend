const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'collections_db',
  user: 'postgres',
  password: 'sree@123'
});

async function createAdmin() {
  try {
    // Check if admin exists
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@test.com']);
    
    if (existing.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      ['admin@test.com', passwordHash, 'admin']
    );

    console.log('Admin user created:', result.rows[0]);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createAdmin();