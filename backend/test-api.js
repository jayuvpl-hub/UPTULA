const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
  try {
    console.log('Testing API endpoints...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test login for employer (user ID 3)
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'deepu1@test.com',
        password: 'password123' // You might need to check the actual password
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Login successful:', loginData);
      
      // Test applications endpoint
      const appsResponse = await fetch('http://localhost:5000/api/employer/applications', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Accept': 'application/json'
        }
      });
      
      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        console.log('Applications:', appsData);
      } else {
        console.error('Applications API failed:', appsResponse.status, appsResponse.statusText);
      }
    } else {
      console.error('Login failed:', loginResponse.status, loginResponse.statusText);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
