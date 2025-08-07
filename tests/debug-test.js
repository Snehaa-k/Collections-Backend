const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test different endpoints
const endpoints = [
  { path: '/health', auth: false },
  { path: '/api/auth/login', auth: false, method: 'POST', data: '{"email":"admin@test.com","password":"admin123"}' },
  { path: '/api/accounts', auth: true }
];

let testToken = null;

function makeRequest(endpoint, callback) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: endpoint.path,
    method: endpoint.method || 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (endpoint.auth && testToken) {
    options.headers['Authorization'] = `Bearer ${testToken}`;
  }

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      callback(null, { status: res.statusCode, data, headers: res.headers });
    });
  });

  req.on('error', (err) => {
    callback(err);
  });

  if (endpoint.data) {
    req.write(endpoint.data);
  }
  
  req.end();
}

async function runTests() {
  console.log('Running diagnostic tests...\n');

  // Test 1: Health check
  console.log('1. Testing /health endpoint...');
  makeRequest(endpoints[0], (err, result) => {
    if (err) {
      console.log('❌ Health check failed:', err.message);
    } else {
      console.log(`✅ Health check: ${result.status} - ${result.data}`);
    }

    // Test 2: Login
    console.log('\n2. Testing login...');
    makeRequest(endpoints[1], (err, result) => {
      if (err) {
        console.log('❌ Login failed:', err.message);
      } else {
        console.log(`Login response: ${result.status}`);
        if (result.status === 200) {
          try {
            const loginData = JSON.parse(result.data);
            testToken = loginData.token;
            console.log('✅ Login successful, token received');
          } catch (e) {
            console.log('❌ Login response parsing failed');
          }
        } else {
          console.log('❌ Login failed with status:', result.status);
          console.log('Response:', result.data);
        }
      }

      // Test 3: Protected endpoint
      console.log('\n3. Testing protected endpoint...');
      makeRequest(endpoints[2], (err, result) => {
        if (err) {
          console.log('❌ Protected endpoint failed:', err.message);
        } else {
          console.log(`Protected endpoint: ${result.status}`);
          if (result.status === 200) {
            console.log('✅ Protected endpoint accessible');
          } else {
            console.log('❌ Protected endpoint failed');
            console.log('Response:', result.data);
          }
        }
        
        console.log('\nDiagnostic complete.');
        process.exit(0);
      });
    });
  });
}

runTests();