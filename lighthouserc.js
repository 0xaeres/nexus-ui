module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3005/landing',
        'http://localhost:3005/login',
        'http://localhost:3005/p/anvay/dashboard',
        'http://localhost:3005/p/anvay/setup-client',
      ],
      numberOfRuns: 3,
      startServerCommand: 'npm run start -- --port 3005',
      startServerReadyPattern: 'Ready',
      settings: {
        chromeFlags: [
          '--headless=new',
          '--disable-gpu',
          '--disable-extensions',
          '--no-sandbox',
        ],
        onlyCategories: ['performance'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
