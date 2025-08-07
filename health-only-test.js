const http = require('http');
const { performance } = require('perf_hooks');

class HealthOnlyTest {
  constructor() {
    this.results = { requests: 0, responses: 0, errors: 0, responseTimes: [] };
  }

  async makeRequest() {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/health',
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = performance.now() - startTime;
          this.results.responses++;
          this.results.responseTimes.push(responseTime);
          
          if (res.statusCode !== 200) {
            this.results.errors++;
            console.log(`❌ Error ${res.statusCode}: ${data}`);
          }
          
          resolve();
        });
      });

      req.on('error', () => {
        this.results.errors++;
        resolve();
      });

      this.results.requests++;
      req.end();
    });
  }

  async runTest() {
    console.log('🧪 Testing ONLY /health endpoint (should have 0% errors)...');
    
    const startTime = Date.now();
    const duration = 10000; // 10 seconds
    const concurrency = 50;
    
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
      workers.push(this.worker(startTime + duration));
    }
    
    await Promise.all(workers);
    
    const errorRate = (this.results.errors / this.results.requests) * 100;
    const avgTime = this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
    
    console.log('\n=== HEALTH ENDPOINT TEST ===');
    console.log(`Requests: ${this.results.requests}`);
    console.log(`Errors: ${this.results.errors}`);
    console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
    console.log(`Avg Response Time: ${avgTime.toFixed(2)}ms`);
    console.log('============================');
    
    if (errorRate === 0) {
      console.log('✅ Health endpoint works perfectly!');
      console.log('❌ The issue is with authentication in your load test');
    } else {
      console.log('❌ Even health endpoint is failing - server issue');
    }
  }

  async worker(endTime) {
    while (Date.now() < endTime) {
      await this.makeRequest();
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }
}

new HealthOnlyTest().runTest();