const db = require('../database/connection');

class Account {
  static async create(accountData) {
    const { account_number, customer_name, customer_email, customer_phone, balance, created_by, assigned_agent, address, metadata } = accountData;
    const result = await db.query(
      `INSERT INTO accounts (account_number, customer_name, customer_email, customer_phone, balance, created_by, assigned_agent, address, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [account_number, customer_name, customer_email, customer_phone, balance || 0, created_by, assigned_agent, JSON.stringify(address), JSON.stringify(metadata)]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM accounts WHERE id = $1 AND is_deleted = false', [id]);
    return result.rows[0];
  }

  static async findAll({ page = 1, limit = 50, filters = {}, sort = 'created_at', order = 'DESC' }) {
    let query = 'SELECT * FROM accounts WHERE is_deleted = false';
    const params = [];
    let paramCount = 0;

    // Apply filters
    if (filters.status) {
      query += ` AND status = $${++paramCount}`;
      params.push(filters.status);
    }
    if (filters.assigned_agent) {
      query += ` AND assigned_agent = $${++paramCount}`;
      params.push(filters.assigned_agent);
    }
    if (filters.customer_name) {
      query += ` AND customer_name ILIKE $${++paramCount}`;
      params.push(`%${filters.customer_name}%`);
    }
    if (filters.balance_min) {
      query += ` AND balance >= $${++paramCount}`;
      params.push(filters.balance_min);
    }
    if (filters.balance_max) {
      query += ` AND balance <= $${++paramCount}`;
      params.push(filters.balance_max);
    }

    // Add sorting
    query += ` ORDER BY ${sort} ${order}`;
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM accounts WHERE is_deleted = false';
    const countParams = params.slice(0, -2); // Remove limit and offset
    if (countParams.length > 0) {
      countQuery = query.split('ORDER BY')[0].replace('SELECT *', 'SELECT COUNT(*)');
    }
    const countResult = await db.query(countQuery, countParams);
    
    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  static async update(id, updateData) {
    const fields = Object.keys(updateData).filter(key => updateData[key] !== undefined);
    const values = fields.map(field => updateData[field]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const result = await db.query(
      `UPDATE accounts SET ${setClause} WHERE id = $${fields.length + 1} AND is_deleted = false RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  }

  static async softDelete(id) {
    const result = await db.query(
      'UPDATE accounts SET is_deleted = true WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async bulkUpdate(updates) {
    return db.transaction(async (client) => {
      const results = [];
      for (const update of updates) {
        const { id, ...data } = update;
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        
        const result = await client.query(
          `UPDATE accounts SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
          [...values, id]
        );
        results.push(result.rows[0]);
      }
      return results;
    });
  }
}

module.exports = Account;