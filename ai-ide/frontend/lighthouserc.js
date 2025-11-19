module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/', // Home page
        'http://localhost:3000/settings', // Settings modal
      ],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:   http://localhost:3000',
      settings: {
        chromeFlags: '--no-sandbox',
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 150,
          downloadThroughputKbps: 675,
          uploadThroughputKbps: 675,
        },
      },
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'server-response-time': ['warn', { maxNumericValue: 800 }],
        'mainthread-tasks': ['warn', { maxNumericValue: 200 }],
        'unused-javascript': ['warn', { maxNumericValue: 0.05 }],
        'unused-css-rules': ['warn', { maxNumericValue: 0.02 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    budget: {
      assertions: {
        'first-contentful-paint': 'budget',
        'largest-contentful-paint': 'budget',
        'cumulative-layout-shift': 'budget',
        'speed-index': 'budget',
      },
      configurations: {
        'desktop': {
          extends: 'lighthouse:default',
          formFactor: 'desktop',
          screenEmulation: {
            mobile: false,
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
          },
          throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1,
          },
        },
        'mobile': {
          extends: 'lighthouse:default',
          formFactor: 'mobile',
          screenEmulation: {
            mobile: true,
            width: 375,
            height: 812,
            deviceScaleFactor: 2,
          },
          throttling: {
            rttMs: 150,
            throughputKbps: 1638.4,
            cpuSlowdownMultiplier: 4,
          },
        },
      },
    },
  },
};