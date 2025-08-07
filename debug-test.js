const http = require('http');

async function quickTest() {
  console.log('🔍 Quick Debug Test...\n');

  // Test 1: Health endpoint (should always work)
  console.log('1. Testing /health endpoint...');
  const healthResult = await makeRequest('GET', '/health');
  console.log(`   Result: ${healthResult.statusCode} - ${healthResult.data.substring(0, 50)}`);

  // Test 2: Login
  console.log('\n2. Testing login...');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@test.com',
    password: 'admin123456'
  });
  console.log(`   Result: ${loginResult.statusCode} - ${loginResult.data.substring(0, 100)}`);

  if (loginResult.statusCode === 200) {
    try {
      const loginData = JSON.parse(loginResult.data);
      if (loginData.token) {
        console.log('   ✅ Login successful, got token');
        
        // Test 3: Protected endpoint with token
        console.log('\n3. Testing /api/accounts with token...');
        const accountsResult = await makeRequest('GET', '/api/accounts', null, loginData.token);
        console.log(`   Result: ${accountsResult.statusCode} - ${accountsResult.data.substring(0, 100)}`);
      }
    } catch (e) {
      console.log('   ❌ Failed to parse login response');
    }
  } else {
    console.log('   ❌ Login failed');
  }

  // Test 4: Protected endpoint without token (should fail with 401)
  console.log('\n4. Testing /api/accounts without token...');
  const noAuthResult = await makeRequest('GET', '/api/accounts');
  console.log(`   Result: ${noAuthResult.statusCode} - ${noAuthResult.data.substring(0, 100)}`);
}

async function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const postData = body ? JSON.stringify(body) : null;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      resolve({ statusCode: 0, data: `Error: ${error.message}` });
    });

    if (postData) req.write(postData);
    req.end();
  });
}

quickTest().catch(console.error);