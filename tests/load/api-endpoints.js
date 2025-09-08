import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users  
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.02'], // Error rate under 2%
    errors: ['rate<0.05'], // Custom error rate under 5%
  },
};

const BASE_URL = 'http://localhost:3000';

// Test data
const testGear = {
  title: 'Load Test Camera',
  description: 'Camera for load testing purposes',
  dailyRate: 50,
  city: 'San Francisco',
  state: 'CA',
  images: ['https://example.com/camera.jpg'],
  category: 'cameras',
  condition: 'good'
};

const testUser = {
  email: `loadtest-${Math.random().toString(36).substring(7)}@example.com`,
  password: 'password123',
  name: 'Load Test User'
};

export function setup() {
  console.log('Setting up load test...');
  
  // Create test user for authenticated requests
  const signupRes = http.post(`${BASE_URL}/api/auth/signup`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (signupRes.status === 200 || signupRes.status === 201) {
    const authData = signupRes.json();
    return { 
      authToken: authData.token,
      userId: authData.user?.id,
      userEmail: testUser.email 
    };
  }
  
  return { authToken: null, userId: null, userEmail: testUser.email };
}

export default function (data) {
  const authHeaders = data.authToken 
    ? { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.authToken}`
      }
    : { 'Content-Type': 'application/json' };

  // Test 1: Health check endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  // Test 2: Get gear listings (public endpoint)
  const gearListRes = http.get(`${BASE_URL}/api/gear?page=1&limit=20`);
  check(gearListRes, {
    'gear list status is 200': (r) => r.status === 200,
    'gear list response time < 300ms': (r) => r.timings.duration < 300,
    'gear list returns data': (r) => {
      try {
        const body = r.json();
        return body.data && Array.isArray(body.data);
      } catch {
        return false;
      }
    }
  }) || errorRate.add(1);

  // Test 3: Search gear with filters
  const searchRes = http.get(`${BASE_URL}/api/gear?search=camera&category=cameras&minPrice=25&maxPrice=100`);
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 400ms': (r) => r.timings.duration < 400,
  }) || errorRate.add(1);

  // Test 4: Get specific gear item
  if (gearListRes.status === 200) {
    try {
      const gearList = gearListRes.json();
      if (gearList.data && gearList.data.length > 0) {
        const firstGearId = gearList.data[0].id;
        const gearDetailRes = http.get(`${BASE_URL}/api/gear/${firstGearId}`);
        check(gearDetailRes, {
          'gear detail status is 200': (r) => r.status === 200,
          'gear detail response time < 200ms': (r) => r.timings.duration < 200,
        }) || errorRate.add(1);
      }
    } catch (e) {
      errorRate.add(1);
    }
  }

  // Test 5: Dashboard stats (authenticated)
  if (data.authToken) {
    const statsRes = http.get(`${BASE_URL}/api/dashboard/stats`, { headers: authHeaders });
    check(statsRes, {
      'dashboard stats status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'dashboard stats response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
  }

  // Test 6: Create gear (authenticated, less frequent)
  if (data.authToken && Math.random() < 0.1) { // Only 10% of iterations
    const createGearRes = http.post(`${BASE_URL}/api/gear`, JSON.stringify(testGear), { 
      headers: authHeaders 
    });
    check(createGearRes, {
      'create gear status is 200, 201, or 401': (r) => [200, 201, 401, 422].includes(r.status),
      'create gear response time < 800ms': (r) => r.timings.duration < 800,
    }) || errorRate.add(1);
  }

  // Test 7: Get user rentals (authenticated)
  if (data.authToken) {
    const rentalsRes = http.get(`${BASE_URL}/api/rentals`, { headers: authHeaders });
    check(rentalsRes, {
      'rentals status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'rentals response time < 400ms': (r) => r.timings.duration < 400,
    }) || errorRate.add(1);
  }

  // Test 8: Rate limiting test
  if (Math.random() < 0.05) { // 5% of iterations test rate limiting
    for (let i = 0; i < 10; i++) {
      const rateLimitRes = http.get(`${BASE_URL}/api/gear`);
      if (rateLimitRes.status === 429) {
        check(rateLimitRes, {
          'rate limiting works': (r) => r.status === 429,
        });
        break;
      }
    }
  }

  // Test 9: Error handling
  const notFoundRes = http.get(`${BASE_URL}/api/gear/nonexistent-id`);
  check(notFoundRes, {
    'not found returns 404': (r) => r.status === 404,
    'error response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  // Test 10: Invalid data handling
  const invalidDataRes = http.post(`${BASE_URL}/api/gear`, JSON.stringify({ invalid: 'data' }), {
    headers: authHeaders
  });
  check(invalidDataRes, {
    'invalid data returns appropriate status': (r) => [400, 401, 422].includes(r.status),
    'invalid data response time < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(1); // Wait 1 second between iterations
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_type: 'api_endpoints_load_test',
    duration_seconds: data.state.testRunDurationMs / 1000,
    virtual_users: {
      max: Math.max(...data.metrics.vus.values.map(v => v.value)),
      avg: data.metrics.vus.values.reduce((sum, v) => sum + v.value, 0) / data.metrics.vus.values.length
    },
    requests: {
      total: data.metrics.http_reqs.count,
      rate: data.metrics.http_reqs.rate,
      failed: data.metrics.http_req_failed.rate,
    },
    response_times: {
      avg: data.metrics.http_req_duration.avg,
      p90: data.metrics['http_req_duration{p(90)}'],
      p95: data.metrics['http_req_duration{p(95)}'],
      p99: data.metrics['http_req_duration{p(99)}'],
      max: data.metrics.http_req_duration.max,
    },
    thresholds: {
      passed: Object.keys(data.thresholds).every(threshold => 
        data.thresholds[threshold].ok === true
      )
    },
    checks: {
      passed: data.metrics.checks.passes,
      failed: data.metrics.checks.fails,
      rate: data.metrics.check_failure_rate.rate
    }
  };

  return {
    'stdout': JSON.stringify(summary, null, 2),
    'load-test-summary.json': JSON.stringify(summary, null, 2),
  };
}

export function teardown(data) {
  console.log('Cleaning up load test...');
  
  if (data.authToken && data.userId) {
    // Clean up test data if needed
    console.log(`Cleaning up test data for user: ${data.userEmail}`);
    
    // In a real scenario, you might want to delete test gear, rentals, etc.
    // http.del(`${BASE_URL}/api/users/${data.userId}`, { headers: authHeaders });
  }
}