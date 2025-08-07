const db = require('../database/connection');

class Payment {
  static async create({ account_id, amount, payment_method, transaction_id, processed_by, notes }) {
    const result = await db.query(
      'INSERT INTO payments (account_id, amount, payment_method, transaction_id, processed_by, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [account_id, amount, payment_method, transaction_id, processed_by, notes]
    );
    return result.rows[0];
  }

  static async findByAccountId(accountId, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const result = await db.query(
      `SELECT p.*, u.email as processed_by_email 
       FROM payments p 
       LEFT JOIN users u ON p.processed_by = u.id 
       WHERE p.account_id = $1 
       ORDER BY p.payment_date DESC 
       LIMIT $2 OFFSET $3`,
      [accountId, limit, offset]
    );
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await db.query(
      'UPDATE payments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
    return result.rows[0];
  }
}

module.exports = Payment;