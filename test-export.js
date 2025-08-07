const http = require('http');

async function testExport() {
  console.log('🧪 Testing Export Functionality...\n');

  // First login to get token
  const loginData = {
    email: 'admin@test.com',
    password: 'admin123456'
  };

  console.log('1. Getting authentication token...');
  const loginResult = await makeRequest('POST', '/api/auth/login', loginData);
  
  if (!loginResult || !loginResult.token) {
    console.log('❌ Login failed. Make sure you have an admin user.');
    return;
  }

  console.log('✅ Got token:', loginResult.token.substring(0, 20) + '...');

  // Test CSV export
  console.log('\n2. Testing CSV export...');
  const csvResult = await makeRequest('GET', '/api/accounts/export?format=csv', null, loginResult.token);
  
  if (csvResult) {
    console.log('✅ CSV export successful!');
    console.log('📄 CSV preview:', csvResult.substring(0, 200) + '...');
  }

  // Test Excel export
  console.log('\n3. Testing Excel export...');
  const excelResult = await makeRequest('GET', '/api/accounts/export?format=excel', null, loginResult.token);
  
  if (excelResult) {
    console.log('✅ Excel export successful!');
    console.log('📊 Excel file size:', Buffer.byteLength(excelResult), 'bytes');
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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (error) {
            // For binary data (Excel) or CSV, return as string
            resolve(responseData);
          }
        } else {
          console.log(`❌ Error ${res.statusCode}:`, responseData);
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

testExport();