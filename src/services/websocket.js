const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.setupAuthentication();
    this.setupEventHandlers();
  }

  setupAuthentication() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected`);
      
      // Join user to their role room
      socket.join(socket.userRole);
      
      socket.on('join_account', (accountId) => {
        socket.join(`account_${accountId}`);
      });
      
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
      });
    });
  }

  // Emit payment notification
  emitPaymentUpdate(accountId, paymentData) {
    this.io.to(`account_${accountId}`).emit('payment_update', {
      type: 'payment_received',
      accountId,
      payment: paymentData,
      timestamp: new Date()
    });
  }

  // Emit activity update
  emitActivityUpdate(accountId, activityData) {
    this.io.to(`account_${accountId}`).emit('activity_update', {
      type: 'new_activity',
      accountId,
      activity: activityData,
      timestamp: new Date()
    });
  }

  // Emit dashboard metrics
  emitMetricsUpdate(metrics) {
    this.io.to('admin').emit('metrics_update', {
      type: 'dashboard_metrics',
      metrics,
      timestamp: new Date()
    });
  }
}

module.exports = WebSocketService;