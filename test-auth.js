// Quick authentication test
const http = require('http');

async function testAuth() {
  console.log('🔐 Testing Authentication Flow...\n');

  // Step 1: Login
  const loginData = {
    email: 'test@example.com',
    password: 'password123'
  };

  console.log('1. Logging in...');
  const loginResult = await makeRequest('POST', '/api/auth/login', loginData);
  
  if (loginResult && loginResult.token) {
    console.log('✅ Login successful!');
    console.log('🎫 Token:', loginResult.token.substring(0, 30) + '...');
    
    // Step 2: Test protected endpoint
    console.log('\n2. Testing protected endpoint...');
    const accountsResult = await makeRequest('GET', '/api/accounts', null, loginResult.token);
    
    if (accountsResult) {
      console.log('✅ Protected endpoint works!');
      console.log('📊 Accounts data:', accountsResult);
    }
  }
}

async function makeRequest(method, path, data, token = null) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
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
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            console.log(`❌ Error ${res.statusCode}:`, parsed);
            resolve(null);
          }
        } catch (error) {
          console.log(`❌ Parse error:`, error.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Request error:`, error.message);
      resolve(null);
    });

    if (postData) req.write(postData);
    req.end();
  });
}

testAuth();