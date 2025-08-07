const { validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Account = require('../models/Account');
const Activity = require('../models/Activity');
const cache = require('../services/cache');
const logger = require('../utils/logger');

class PaymentController {
  static async createPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id: accountId } = req.params;
      const { amount, payment_method, transaction_id, notes } = req.body;

      // Check if account exists
      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Create payment
      const payment = await Payment.create({
        account_id: accountId,
        amount,
        payment_method,
        transaction_id,
        processed_by: req.user.id,
        notes
      });

      // Log activity
      await Activity.create({
        account_id: accountId,
        user_id: req.user.id,
        activity_type: 'payment_recorded',
        description: `Payment of $${amount} recorded by ${req.user.email}`,
        metadata: { payment_id: payment.id, amount, payment_method }
      });

      // Update account balance if payment is completed
      if (payment.status === 'completed') {
        await Account.update(accountId, { 
          balance: account.balance - parseFloat(amount) 
        });
      }

      // Invalidate cache
      await cache.del(`account:${accountId}`);
      await cache.del(`payments:${accountId}:*`);

      logger.info(`Payment recorded: ${payment.id} for account ${accountId}`);
      res.status(201).json(payment);
    } catch (error) {
      logger.error('Create payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getPaymentHistory(req, res) {
    try {
      const { id: accountId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const cacheKey = `payments:${accountId}:${page}:${limit}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Check if account exists
      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const payments = await Payment.findByAccountId(accountId, {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100)
      });

      const result = {
        data: payments,
        account_id: accountId,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      await cache.set(cacheKey, JSON.stringify(result), 300); // 5 minutes
      res.json(result);
    } catch (error) {
      logger.error('Get payment history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updatePaymentStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id: paymentId } = req.params;
      const { status, notes } = req.body;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Update payment status
      const updatedPayment = await Payment.updateStatus(paymentId, status);

      // Log activity
      await Activity.create({
        account_id: payment.account_id,
        user_id: req.user.id,
        activity_type: 'payment_status_updated',
        description: `Payment status updated to ${status} by ${req.user.email}`,
        metadata: { payment_id: paymentId, old_status: payment.status, new_status: status }
      });

      // If payment completed, update account balance
      if (status === 'completed' && payment.status !== 'completed') {
        const account = await Account.findById(payment.account_id);
        await Account.update(payment.account_id, {
          balance: account.balance - parseFloat(payment.amount)
        });
      }

      // Invalidate cache
      await cache.del(`account:${payment.account_id}`);
      await cache.del(`payments:${payment.account_id}:*`);

      logger.info(`Payment status updated: ${paymentId} to ${status}`);
      res.json(updatedPayment);
    } catch (error) {
      logger.error('Update payment status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = PaymentController;