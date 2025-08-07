const http = require('http');

const BASE_URL = 'http://localhost:3000';
const CONCURRENT_USERS = 100;
const TEST_DURATION = 10000; // 10 seconds

let totalRequests = 0;
let totalResponses = 0;
let totalErrors = 0;
let responseTimes = [];

function makeRequest() {
  const startTime = Date.now();
  
  const req = http.get(`${BASE_URL}/health`, (res) => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    totalResponses++;
    responseTimes.push(responseTime);
    
    if (res.statusCode !== 200) {
      totalErrors++;
    }
  });

  req.on('error', () => {
    totalErrors++;
  });

  totalRequests++;
}

function runTest() {
  console.log('Starting health-only load test...');
  const startTime = Date.now();
  
  // Start concurrent users
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    const interval = setInterval(makeRequest, 50); // 20 requests per second per user
    
    setTimeout(() => {
      clearInterval(interval);
    }, TEST_DURATION);
  }
  
  setTimeout(() => {
    const duration = Date.now() - startTime;
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const rps = (totalResponses / duration) * 1000;
    const errorRate = (totalErrors / totalRequests) * 100;
    
    console.log('\n=== HEALTH TEST RESULTS ===');
    console.log(`Duration: ${duration}ms`);
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Total Responses: ${totalResponses}`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Requests/Second: ${rps.toFixed(2)}`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
    console.log('========================');
    
    process.exit(0);
  }, TEST_DURATION + 1000);
}

runTest();