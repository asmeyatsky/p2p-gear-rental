module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/auth/login', 'http://localhost:3000/gear'],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready',
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-dev-shm-usage',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        skipAudits: [
          'uses-http2',
          'canonical',
          'is-crawlable',
        ],
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        
        // Performance metrics
        'interactive': ['error', { maxNumericValue: 3500 }],
        'max-potential-fid': ['error', { maxNumericValue: 100 }],
        'server-response-time': ['error', { maxNumericValue: 500 }],
        
        // Resource optimization
        'unused-css-rules': ['warn', { maxLength: 1 }],
        'unused-javascript': ['warn', { maxLength: 1 }],
        'modern-image-formats': ['warn', { maxLength: 0 }],
        'offscreen-images': ['warn', { maxLength: 0 }],
        'render-blocking-resources': ['warn', { maxLength: 1 }],
        'unminified-css': ['error', { maxLength: 0 }],
        'unminified-javascript': ['error', { maxLength: 0 }],
        
        // Security and best practices
        'is-on-https': 'off', // Disabled for localhost testing
        'uses-https': 'off', // Disabled for localhost testing
        'redirects-http': 'off', // Disabled for localhost testing
      },
    },
    upload: {
      target: 'temporary-public-storage',
      reportFilenamePattern: 'lighthouse-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};