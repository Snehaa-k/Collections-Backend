const express = require('express');
const PaymentController = require('../controllers/paymentController');
const { paymentValidators } = require('../utils/validators');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/accounts/{id}/payments:
 *   post:
 *     summary: Record payment for account
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500.00
 *               payment_method:
 *                 type: string
 *                 example: "credit_card"
 *               transaction_id:
 *                 type: string
 *                 example: "TXN123456"
 *               notes:
 *                 type: string
 *                 example: "Monthly payment"
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 */
router.post('/accounts/:id/payments', authenticateToken, authorize(['admin', 'manager', 'agent']), paymentValidators.create, PaymentController.createPayment);

/**
 * @swagger
 * /api/accounts/{id}/payments:
 *   get:
 *     summary: Get payment history for account
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Account ID
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
 *     responses:
 *       200:
 *         description: Payment history
 */
router.get('/accounts/:id/payments', authenticateToken, PaymentController.getPaymentHistory);

/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     summary: Update payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, failed, refunded]
 *                 example: "completed"
 *               notes:
 *                 type: string
 *                 example: "Payment processed successfully"
 *     responses:
 *       200:
 *         description: Payment status updated
 */
router.put('/payments/:id', authenticateToken, authorize(['admin', 'manager', 'agent']), PaymentController.updatePaymentStatus);

module.exports = router;