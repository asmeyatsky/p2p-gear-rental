#!/usr/bin/env node

/**
 * Health check script for Docker container
 * This script checks if the Next.js application is healthy and responding
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 3000,
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const health = JSON.parse(data);
        if (health.status === 'healthy' || health.status === 'degraded') {
          console.log(`Health check passed: ${health.status}`);
          process.exit(0);
        } else {
          console.error(`Health check failed: ${health.status}`);
          process.exit(1);
        }
      } catch (error) {
        console.error('Health check failed: Invalid JSON response');
        process.exit(1);
      }
    } else {
      console.error(`Health check failed: HTTP ${res.statusCode}`);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error(`Health check failed: ${error.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Health check failed: Timeout');
  req.destroy();
  process.exit(1);
});

req.setTimeout(3000);
req.end();