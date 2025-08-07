const db = require('../database/connection');

class Activity {
  static async create({ account_id, user_id, activity_type, description, metadata }) {
    const result = await db.query(
      'INSERT INTO activities (account_id, user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [account_id, user_id, activity_type, description, JSON.stringify(metadata)]
    );
    return result.rows[0];
  }

  static async findRecentDuplicate({ account_id, user_id, activity_type, description, minutes = 5 }) {
    const result = await db.query(
      `SELECT * FROM activities 
       WHERE account_id = $1 AND user_id = $2 AND activity_type = $3 AND description = $4
       AND created_at > NOW() - INTERVAL '${minutes} minutes'
       ORDER BY created_at DESC LIMIT 1`,
      [account_id, user_id, activity_type, description]
    );
    return result.rows[0];
  }

  static async findByAccountId(accountId, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const result = await db.query(
      `SELECT a.*, u.email as user_email 
       FROM activities a 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE a.account_id = $1 
       ORDER BY a.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [accountId, limit, offset]
    );
    return result.rows;
  }

  static async findByAccountId(accountId, { page = 1, limit = 50, activity_type } = {}) {
    const offset = (page - 1) * limit;
    let query = `SELECT a.*, u.email as user_email 
                 FROM activities a 
                 LEFT JOIN users u ON a.user_id = u.id 
                 WHERE a.account_id = $1`;
    const params = [accountId];
    
    if (activity_type) {
      query += ` AND a.activity_type = $${params.length + 1}`;
      params.push(activity_type);
    }
    
    query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findBulk({ account_ids = [], activity_type, start_date, end_date, limit = 1000 }) {
    let query = `SELECT a.*, u.email as user_email, acc.customer_name
                 FROM activities a 
                 LEFT JOIN users u ON a.user_id = u.id
                 LEFT JOIN accounts acc ON a.account_id = acc.id
                 WHERE 1=1`;
    const params = [];
    
    if (account_ids.length > 0) {
      query += ` AND a.account_id = ANY($${params.length + 1})`;
      params.push(account_ids);
    }
    
    if (activity_type) {
      query += ` AND a.activity_type = $${params.length + 1}`;
      params.push(activity_type);
    }
    
    if (start_date) {
      query += ` AND a.created_at >= $${params.length + 1}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND a.created_at <= $${params.length + 1}`;
      params.push(end_date);
    }
    
    query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await db.query(query, params);
    return result.rows;
  }

  static async bulkCreate(activities) {
    return db.transaction(async (client) => {
      const results = [];
      for (const activity of activities) {
        const result = await client.query(
          'INSERT INTO activities (account_id, user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [activity.account_id, activity.user_id, activity.activity_type, activity.description, JSON.stringify(activity.metadata)]
        );
        results.push(result.rows[0]);
      }
      return results;
    });
  }
}

module.exports = Activity;