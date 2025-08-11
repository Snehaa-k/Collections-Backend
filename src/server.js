require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const metricsCollector = require('./middleware/metrics');
const WebSocketService = require('./services/websocket');
const runMigrations = require('./database/migrate-simple');
const seedDatabase = require('./database/seed');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const paymentRoutes = require('./routes/payments');
const activityRoutes = require('./routes/activities');
const metricsRoutes = require('./routes/metrics');


const app = express();
const PORT = process.env.PORT || 3000;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Collections Management API',
      version: '1.0.0',
      description: 'High-performance collections management platform API',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-app.onrender.com'}`
          : `http://localhost:${PORT}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - allow all origins in production for API testing
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? true  // Allow all origins in production
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition', 'Content-Type']
};

app.use(cors(corsOptions));

// Performance middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter);

// Metrics collection
app.use(metricsCollector.middleware());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Serve static files
app.use(express.static('.'));

// Serve Socket.IO client
app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(__dirname + '/../node_modules/socket.io/client-dist/socket.io.js');
});

// Test WebSocket page
app.get('/test', (req, res) => {
  res.sendFile('test-websocket.html', { root: '.' });
});



// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api', paymentRoutes);
app.use('/api', activityRoutes);

app.use('/', metricsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

const server = app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`Metrics Dashboard available at http://localhost:${PORT}/dashboard`);
  
  // Run migrations and seeding on startup (production)
  if (process.env.NODE_ENV === 'production') {
    try {
      logger.info('Running database migrations...');
      await runMigrations();
      
      logger.info('Seeding database...');
      await seedDatabase();
      
      logger.info('Database setup completed successfully');
    } catch (error) {
      logger.error('Database setup failed:', error);
      // Don't exit - let the server run even if migrations fail
    }
  }
});

// Initialize WebSocket service
const wsService = new WebSocketService(server);
app.set('wsService', wsService);

module.exports = app;