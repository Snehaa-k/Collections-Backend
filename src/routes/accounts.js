const express = require('express');
const AccountController = require('../controllers/accountController');
const { accountValidators } = require('../utils/validators');
const { authenticateToken, authorize } = require('../middleware/auth');
const { bulkLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get accounts with pagination and filtering
 *     description: |
 *       🔐 **Authentication Required**: Click the 🔒 Authorize button above and paste your JWT token as: `Bearer YOUR_TOKEN`
 *       
 *       Get your token from POST /api/auth/login first!
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, closed]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of accounts
 */
router.get('/', authenticateToken, accountValidators.query, AccountController.getAccounts);

/**
 * @swagger
 * /api/accounts/bulk-update:
 *   post:
 *     summary: Bulk update accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Bulk update completed
 */
router.post('/bulk-update', authenticateToken, authorize(['admin', 'manager']), bulkLimiter, AccountController.bulkUpdate);

/**
 * @swagger
 * /api/accounts/export:
 *   get:
 *     summary: Export accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *         description: Export format
 *     responses:
 *       200:
 *         description: Exported file
 */
router.get('/export', authenticateToken, authorize(['admin', 'manager']), AccountController.exportAccounts);

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create new account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_number
 *               - customer_name
 *             properties:
 *               account_number:
 *                 type: string
 *               customer_name:
 *                 type: string
 *               customer_email:
 *                 type: string
 *                 format: email
 *               customer_phone:
 *                 type: string
 *               balance:
 *                 type: number
 *               assigned_agent:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Account created successfully
 */
router.post('/', authenticateToken, authorize(['admin', 'manager', 'agent']), accountValidators.create, AccountController.createAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Account details
 *       404:
 *         description: Account not found
 */
router.get('/:id', authenticateToken, AccountController.getAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   put:
 *     summary: Update account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Account updated successfully
 */
router.put('/:id', authenticateToken, authorize(['admin', 'manager', 'agent']), accountValidators.update, AccountController.updateAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Delete account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete('/:id', authenticateToken, authorize(['admin', 'manager']), AccountController.deleteAccount);

module.exports = router;