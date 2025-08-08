const os = require('os');

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      memoryUsage: [],
      cpuUsage: []
    };
    
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);
  }

  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed
    });
    
    this.metrics.cpuUsage.push({
      timestamp: Date.now(),
      user: cpuUsage.user,
      system: cpuUsage.system
    });
    
    // Keep only last 100 entries
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
    }
    if (this.metrics.cpuUsage.length > 100) {
      this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-100);
    }
  }

  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        this.metrics.requests++;
        this.metrics.responseTimes.push(responseTime);
        
        if (res.statusCode >= 400) {
          this.metrics.errors++;
        }
        
        // Keep only last 1000 response times
        if (this.metrics.responseTimes.length > 1000) {
          this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
        }
      });
      
      next();
    };
  }

  getMetrics() {
    const avgResponseTime = this.metrics.responseTimes.length > 0 
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length 
      : 0;
      
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
      avgResponseTime,
      memoryUsage: this.metrics.memoryUsage.slice(-10),
      cpuUsage: this.metrics.cpuUsage.slice(-10),
      uptime: process.uptime()
    };
  }
}

const metricsCollector = new MetricsCollector();
module.exports = metricsCollector;