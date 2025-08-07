const express = require('express');
const ActivityController = require('../controllers/activityController');
const { activityValidators } = require('../utils/validators');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/accounts/{id}/activities:
 *   post:
 *     summary: Log collection activity for account
 *     tags: [Activities]
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
 *               - activity_type
 *               - description
 *             properties:
 *               activity_type:
 *                 type: string
 *                 example: "phone_call"
 *               description:
 *                 type: string
 *                 example: "Called customer regarding overdue payment"
 *               metadata:
 *                 type: object
 *                 example: {"call_duration": "5 minutes", "outcome": "promised payment"}
 *     responses:
 *       201:
 *         description: Activity logged successfully
 */
router.post('/accounts/:id/activities', authenticateToken, authorize(['admin', 'manager', 'agent']), activityValidators.create, ActivityController.logActivity);

/**
 * @swagger
 * /api/accounts/{id}/activities:
 *   get:
 *     summary: Get activity timeline for account
 *     tags: [Activities]
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
 *       - in: query
 *         name: activity_type
 *         schema:
 *           type: string
 *         description: Filter by activity type
 *     responses:
 *       200:
 *         description: Activity timeline
 */
router.get('/accounts/:id/activities', authenticateToken, ActivityController.getActivityTimeline);

/**
 * @swagger
 * /api/activities/bulk:
 *   get:
 *     summary: Bulk activity retrieval
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: account_ids
 *         schema:
 *           type: string
 *         description: Comma-separated account IDs
 *         example: "1,2,3,4,5"
 *       - in: query
 *         name: activity_type
 *         schema:
 *           type: string
 *         description: Filter by activity type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         description: Maximum activities to return
 *     responses:
 *       200:
 *         description: Bulk activities data
 */
router.get('/activities/bulk', authenticateToken, authorize(['admin', 'manager']), ActivityController.getBulkActivities);

module.exports = router;