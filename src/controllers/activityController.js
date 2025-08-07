const { validationResult } = require('express-validator');
const Activity = require('../models/Activity');
const Account = require('../models/Account');
const cache = require('../services/cache');
const logger = require('../utils/logger');

class ActivityController {
  static async logActivity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id: accountId } = req.params;
      const { activity_type, description, metadata } = req.body;

      // Check if account exists
      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Check for recent duplicate (within last 5 minutes)
      const recentActivity = await Activity.findRecentDuplicate({
        account_id: accountId,
        user_id: req.user.id,
        activity_type,
        description,
        minutes: 5
      });

      if (recentActivity) {
        return res.status(409).json({ 
          error: 'Duplicate activity detected',
          existing_activity: recentActivity
        });
      }

      // Create activity
      const activity = await Activity.create({
        account_id: accountId,
        user_id: req.user.id,
        activity_type,
        description,
        metadata
      });

      // Invalidate cache
      await cache.del(`activities:${accountId}:*`);
      await cache.del('activities:bulk:*');

      logger.info(`Activity logged: ${activity.id} for account ${accountId}`);
      res.status(201).json(activity);
    } catch (error) {
      logger.error('Log activity error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getActivityTimeline(req, res) {
    try {
      const { id: accountId } = req.params;
      const { page = 1, limit = 50, activity_type } = req.query;

      const cacheKey = `activities:${accountId}:${page}:${limit}:${activity_type || 'all'}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Check if account exists
      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const activities = await Activity.findByAccountId(accountId, {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        activity_type
      });

      const result = {
        data: activities,
        account_id: accountId,
        page: parseInt(page),
        limit: parseInt(limit),
        filter: { activity_type }
      };

      await cache.set(cacheKey, JSON.stringify(result), 300); // 5 minutes
      res.json(result);
    } catch (error) {
      logger.error('Get activity timeline error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getBulkActivities(req, res) {
    try {
      const { account_ids, activity_type, start_date, end_date, limit = 1000 } = req.query;

      const cacheKey = `activities:bulk:${JSON.stringify(req.query)}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Parse account IDs
      const accountIdArray = account_ids ? account_ids.split(',').map(id => parseInt(id.trim())) : [];

      const activities = await Activity.findBulk({
        account_ids: accountIdArray,
        activity_type,
        start_date,
        end_date,
        limit: Math.min(parseInt(limit), 1000)
      });

      const result = {
        data: activities,
        filters: {
          account_ids: accountIdArray,
          activity_type,
          start_date,
          end_date
        },
        total: activities.length
      };

      await cache.set(cacheKey, JSON.stringify(result), 600); // 10 minutes
      res.json(result);
    } catch (error) {
      logger.error('Get bulk activities error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = ActivityController;