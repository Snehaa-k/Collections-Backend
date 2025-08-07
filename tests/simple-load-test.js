const http = require('http');
const { performance } = require('perf_hooks');

class SimpleLoadTester {
  constructor() {
    this.results = {
      requests: 0,
      responses: 0,
      errors: 0,
      responseTimes: [],
      errorDetails: {}
    };
  }

  async makeRequest(path, token = null) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const options = {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
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
            // Track error types
            const errorKey = `${res.statusCode}`;
            this.results.errorDetails[errorKey] = (this.results.errorDetails[errorKey] || 0) + 1;
            console.log(`❌ Error ${res.statusCode} on ${path}: ${data.substring(0, 100)}`);
          } else {
            console.log(`✅ Success ${res.statusCode} on ${path} (${responseTime.toFixed(2)}ms)`);
          }
          
          resolve({ statusCode: res.statusCode, responseTime, data });
        });
      });

      req.on('error', (error) => {
        this.results.errors++;
        console.log(`❌ Request error on ${path}:`, error.message);
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

  async testHealthEndpoint() {
    console.log('\n🧪 Testing Health Endpoint (No Auth Required)...');
    
    for (let i = 0; i < 10; i++) {
      await this.makeRequest('/health');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async testWithAuthentication() {
    console.log('\n🔐 Testing with Authentication...');
    
    // First login to get token
    const loginResult = await this.login();
    if (!loginResult.token) {
      console.log('❌ Login failed, skipping auth tests');
      return;
    }

    console.log('✅ Login successful, testing protected endpoints...');
    
    // Test protected endpoints
    for (let i = 0; i < 5; i++) {
      await this.makeRequest('/api/accounts', loginResult.token);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  async login() {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123456'
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
            if (res.statusCode === 200 && response.token) {
              resolve(response);
            } else {
              console.log('❌ Login failed:', data);
              resolve({});
            }
          } catch (error) {
            console.log('❌ Login parse error:', error.message);
            resolve({});
          }
        });
      });

      req.on('error', (error) => {
        console.log('❌ Login request error:', error.message);
        resolve({});
      });

      req.write(postData);
      req.end();
    });
  }

  async runDiagnosticTest() {
    console.log('🔍 Running Diagnostic Load Test...\n');
    
    // Reset results
    this.results = {
      requests: 0,
      responses: 0,
      errors: 0,
      responseTimes: [],
      errorDetails: {}
    };

    // Test 1: Health endpoint (should have 0% errors)
    await this.testHealthEndpoint();
    
    // Test 2: Authentication flow
    await this.testWithAuthentication();
    
    // Print results
    this.printResults();
  }

  printResults() {
    const avgResponseTime = this.results.responseTimes.length > 0 
      ? this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length 
      : 0;
    const errorRate = (this.results.errors / this.results.requests) * 100;

    console.log('\n=== DIAGNOSTIC TEST RESULTS ===');
    console.log(`Total Requests: ${this.results.requests}`);
    console.log(`Total Responses: ${this.results.responses}`);
    console.log(`Total Errors: ${this.results.errors}`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
    
    if (Object.keys(this.results.errorDetails).length > 0) {
      console.log('\nError Breakdown:');
      Object.entries(this.results.errorDetails).forEach(([code, count]) => {
        console.log(`  ${code}: ${count} errors`);
      });
    }
    console.log('===============================\n');
  }
}

// Run the diagnostic test
if (require.main === module) {
  const tester = new SimpleLoadTester();
  tester.runDiagnosticTest().catch(console.error);
}

module.exports = SimpleLoadTester;