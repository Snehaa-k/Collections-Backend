const http = require('http');
const { performance } = require('perf_hooks');

// Simple, dependency-free load tester
class LoadTester {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 50;
    this.duration = options.duration || 30000; // 30 seconds
    this.results = {
      requests: 0,
      responses: 0,
      errors: 0,
      responseTimes: [],
      startTime: null,
      endTime: null
    };
  }

  async authenticate() {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        email: 'admin@collections.com',
        password: 'admin123!'
      });

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response.token);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  async makeRequest(path, token) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const options = {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      this.results.requests++;

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          this.results.responses++;
          this.results.responseTimes.push(responseTime);
          
          if (res.statusCode >= 400) {
            this.results.errors++;
          }
          
          resolve({ statusCode: res.statusCode, responseTime });
        });
      });

      req.on('error', () => {
        this.results.errors++;
        resolve({ error: true });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        this.results.errors++;
        resolve({ timeout: true });
      });

      req.end();
    });
  }

  async runTest() {
    console.log(`Starting load test with ${this.concurrency} concurrent users for ${this.duration}ms`);
    
    try {
      const token = await this.authenticate();
      console.log('Authentication successful');
      
      this.results.startTime = Date.now();
      const endTime = this.results.startTime + this.duration;
      
      const workers = [];
      
      for (let i = 0; i < this.concurrency; i++) {
        workers.push(this.worker(token, endTime));
      }
      
      await Promise.all(workers);
      this.results.endTime = Date.now();
      
      this.printResults();
    } catch (error) {
      console.error('Load test failed:', error);
    }
  }

  async worker(token, endTime) {
    const endpoints = [
      '/api/accounts',
      '/api/accounts?page=1&limit=10',
      '/api/accounts?status=active',
      '/health'
    ];

    while (Date.now() < endTime) {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      await this.makeRequest(endpoint, token);
      
      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  printResults() {
    const duration = this.results.endTime - this.results.startTime;
    const rps = (this.results.responses / duration) * 1000;
    const avgResponseTime = this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
    const p95ResponseTime = this.results.responseTimes.sort((a, b) => a - b)[Math.floor(this.results.responseTimes.length * 0.95)];
    const errorRate = (this.results.errors / this.results.requests) * 100;

    console.log('\n=== LOAD TEST RESULTS ===');
    console.log(`Duration: ${duration}ms`);
    console.log(`Total Requests: ${this.results.requests}`);
    console.log(`Total Responses: ${this.results.responses}`);
    console.log(`Total Errors: ${this.results.errors}`);
    console.log(`Requests/Second: ${rps.toFixed(2)}`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`95th Percentile Response Time: ${p95ResponseTime.toFixed(2)}ms`);
    console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
    console.log('========================\n');
  }
}

// Run the test
if (require.main === module) {
  console.log('🚀 Starting Load Test...');
  console.log('Make sure server is running: npm run dev');
  
  const tester = new LoadTester({
    concurrency: 50,  // Reduced for stability
    duration: 30000   // 30 seconds
  });
  
  tester.runTest().catch(console.error);
}

module.exports = LoadTester;