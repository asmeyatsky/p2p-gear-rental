import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000'; // Change if your app runs on different port

async function makeApiRequests() {
  console.log('🌐 Starting API request generator...');
  console.log('This will make HTTP requests to your application endpoints');
  console.log('Make sure your app is running on http://localhost:3000\n');

  let requestCount = 0;

  const apiEndpoints = [
    {
      name: 'GET /api/gear',
      method: 'GET',
      url: `${BASE_URL}/api/gear`,
    },
    {
      name: 'GET /api/gear?limit=10',
      method: 'GET', 
      url: `${BASE_URL}/api/gear?limit=10`,
    },
    {
      name: 'GET /api/gear?category=cameras',
      method: 'GET',
      url: `${BASE_URL}/api/gear?category=cameras`,
    },
    {
      name: 'GET /api/users/me',
      method: 'GET',
      url: `${BASE_URL}/api/users/me`,
      headers: { 'Authorization': 'Bearer mock-token' }
    },
    {
      name: 'GET /api/search?q=canon',
      method: 'GET',
      url: `${BASE_URL}/api/search?q=canon`,
    },
    {
      name: 'POST /api/auth/check',
      method: 'POST',
      url: `${BASE_URL}/api/auth/check`,
      body: { email: 'test@example.com' }
    },
    {
      name: 'GET /api/health',
      method: 'GET',
      url: `${BASE_URL}/api/health`,
    },
    {
      name: 'GET /api/gear/categories',
      method: 'GET',
      url: `${BASE_URL}/api/gear/categories`,
    },
    {
      name: 'GET /api/gear?city=New York',
      method: 'GET',
      url: `${BASE_URL}/api/gear?city=New York`,
    },
    {
      name: 'GET /api/stats',
      method: 'GET',
      url: `${BASE_URL}/api/stats`,
    }
  ];

  console.log('🔄 Starting API requests (every 3 seconds)...');

  while (true) {
    try {
      // Make 2-4 random API requests per cycle
      const numRequests = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numRequests; i++) {
        const endpoint = apiEndpoints[Math.floor(Math.random() * apiEndpoints.length)];
        
        try {
          const startTime = Date.now();
          
          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json',
              ...endpoint.headers
            },
            body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
          });

          const duration = Date.now() - startTime;
          requestCount++;
          
          console.log(`🌐[${requestCount}] ${endpoint.name}: ${response.status} (${duration}ms)`);
          
          // Read response body if successful
          if (response.ok) {
            const text = await response.text();
            console.log(`   📄 Response: ${text.substring(0, 100)}...`);
          } else {
            console.log(`   ❌ Error: ${response.statusText}`);
          }
          
        } catch (error) {
          console.log(`⚠️[${requestCount}] ${endpoint.name}: ${error.message}`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`⏰ API cycle completed. Next cycle in 3 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error('❌ API cycle failed:', error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down API request generator...');
  console.log(`📊 Total API requests processed: ${requestCount}`);
  process.exit(0);
});

makeApiRequests().catch((error) => {
  console.error('❌ API request generator failed:', error);
  process.exit(1);
});