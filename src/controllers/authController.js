const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');
const cache = require('../services/cache');

class AuthController {
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, role } = req.body;
      
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const user = await User.create({ email, password, role });
      logger.info(`User registered: ${email}`);
      
      res.status(201).json({
        message: 'User registered successfully',
        user: { id: user.id, email: user.email, role: user.role }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await User.findByEmail(email);

      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if account is locked
      if (user.locked_until && new Date() < new Date(user.locked_until)) {
        return res.status(423).json({ error: 'Account temporarily locked' });
      }

      const isValidPassword = await User.validatePassword(password, user.password_hash);
      
      if (!isValidPassword) {
        await User.incrementFailedAttempts(user.id);
        
        // Lock account after 5 failed attempts
        if (user.failed_login_attempts >= 4) {
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          await User.lockAccount(user.id, lockUntil);
        }
        
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Reset failed attempts on successful login
      await User.resetFailedAttempts(user.id);

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Cache user session
      await cache.set(`user:${user.id}`, JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role
      }), 24 * 60 * 60); // 24 hours

      logger.info(`User logged in: ${email}`);
      
      res.json({
        token,
        user: { id: user.id, email: user.email, role: user.role }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async logout(req, res) {
    try {
      // Remove user from cache
      await cache.del(`user:${req.user.id}`);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = AuthController;