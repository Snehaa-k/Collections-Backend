class QueryBuilder {
  static buildDynamicQuery(filters) {
    let query = 'SELECT * FROM accounts WHERE is_deleted = false';
    const params = [];
    let paramCount = 0;

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      switch (key) {
        case 'custom_field':
          query += ` AND metadata->>'${value.field}' = $${++paramCount}`;
          params.push(value.value);
          break;
        case 'date_range':
          query += ` AND created_at BETWEEN $${++paramCount} AND $${++paramCount}`;
          params.push(value.start, value.end);
          break;
        case 'search':
          query += ` AND (customer_name ILIKE $${++paramCount} OR customer_email ILIKE $${++paramCount})`;
          params.push(`%${value}%`, `%${value}%`);
          break;
        default:
          if (typeof value === 'string') {
            query += ` AND ${key} ILIKE $${++paramCount}`;
            params.push(`%${value}%`);
          } else {
            query += ` AND ${key} = $${++paramCount}`;
            params.push(value);
          }
      }
    });

    return { query, params };
  }
}

module.exports = QueryBuilder;