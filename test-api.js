const http = require('http');

// Test API endpoints
async function testAPI() {
  console.log('🧪 Testing Collections API...\n');

  // Test 1: Health Check
  await testEndpoint('GET', '/health', null, 'Health Check');

  // Test 2: Register User
  const registerData = {
    email: 'test@example.com',
    password: 'password123!',
    role: 'agent'
  };
  const registerResult = await testEndpoint('POST', '/api/auth/register', registerData, 'User Registration');

  // Test 3: Login User
  const loginData = {
    email: 'test@example.com',
    password: 'password123!'
  };
  const loginResult = await testEndpoint('POST', '/api/auth/login', loginData, 'User Login');
  
  if (loginResult && loginResult.token) {
    console.log('✅ Got JWT token:', loginResult.token.substring(0, 20) + '...');
    
    // Test 4: Get Accounts (with auth)
    await testEndpoint('GET', '/api/accounts', null, 'Get Accounts', loginResult.token);
    
    // Test 5: Create Account
    const accountData = {
      account_number: 'TEST001',
      customer_name: 'Test Customer',
      customer_email: 'customer@test.com',
      balance: 1000
    };
    await testEndpoint('POST', '/api/accounts', accountData, 'Create Account', loginResult.token);
  }

  console.log('\n🎉 API Testing Complete!');
}

async function testEndpoint(method, path, data, testName, token = null) {
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

    console.log(`🔍 Testing: ${testName} (${method} ${path})`);

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ ${testName}: SUCCESS (${res.statusCode})`);
            resolve(parsed);
          } else {
            console.log(`❌ ${testName}: FAILED (${res.statusCode})`, parsed.error || parsed.message);
            resolve(null);
          }
        } catch (error) {
          console.log(`✅ ${testName}: SUCCESS (${res.statusCode}) - Non-JSON response`);
          resolve(responseData);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${testName}: CONNECTION ERROR -`, error.message);
      resolve(null);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Run tests
testAPI().catch(console.error);