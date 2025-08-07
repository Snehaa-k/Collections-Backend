const db = require('../database/connection');
const bcrypt = require('bcrypt');

class User {
  static async create({ email, password, role = 'viewer' }) {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [email, passwordHash, role]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query('SELECT id, email, role, is_active FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async incrementFailedAttempts(userId) {
    await db.query(
      'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1',
      [userId]
    );
  }

  static async lockAccount(userId, lockUntil) {
    await db.query(
      'UPDATE users SET locked_until = $1 WHERE id = $2',
      [lockUntil, userId]
    );
  }

  static async resetFailedAttempts(userId) {
    await db.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
      [userId]
    );
  }
}

module.exports = User;