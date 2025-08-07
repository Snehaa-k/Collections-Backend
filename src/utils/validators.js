const { body, query, param } = require('express-validator');

const authValidators = {
  register: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['admin', 'manager', 'agent', 'viewer'])
  ],
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ]
};

const accountValidators = {
  create: [
    body('account_number').notEmpty().isLength({ max: 100 }),
    body('customer_name').notEmpty().isLength({ max: 255 }),
    body('customer_email').optional().isEmail(),
    body('customer_phone').optional().isLength({ max: 50 }),
    body('balance').optional().isDecimal(),
    body('assigned_agent').optional().isInt()
  ],
  update: [
    body('customer_name').optional().isLength({ max: 255 }),
    body('customer_email').optional().isEmail(),
    body('customer_phone').optional().isLength({ max: 50 }),
    body('balance').optional().isDecimal(),
    body('status').optional().isIn(['active', 'inactive', 'closed']),
    body('assigned_agent').optional().isInt()
  ],
  query: [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sort').optional().isIn(['created_at', 'customer_name', 'balance', 'status']),
    query('order').optional().isIn(['ASC', 'DESC'])
  ]
};

const paymentValidators = {
  create: [
    body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal'),
    body('payment_method').optional().isLength({ max: 100 }),
    body('transaction_id').optional().isLength({ max: 255 }),
    body('notes').optional().isLength({ max: 1000 })
  ]
};

const activityValidators = {
  create: [
    body('activity_type').notEmpty().isLength({ max: 100 }).withMessage('Activity type is required'),
    body('description').notEmpty().isLength({ max: 1000 }).withMessage('Description is required'),
    body('metadata').optional().isObject()
  ]
};

module.exports = {
  authValidators,
  accountValidators,
  paymentValidators,
  activityValidators
};