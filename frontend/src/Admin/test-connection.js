import { API_BASE_URL } from '../config/api';

// Test script to verify backend connection
const testAdminLogin = async () => {
  try {
    console.log('Testing admin login connection...');
    
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@uptula.com',
        password: 'admin@uptula78945'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Login successful:', data);
    } else {
      const error = await response.text();
      console.log('Login failed:', error);
    }
  } catch (error) {
    console.error('Connection error:', error);
  }
};

// Run the test
testAdminLogin();
