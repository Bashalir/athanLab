import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'webkit-ios12-like',
      use: {
        ...devices['iPhone 8'],
        browserName: 'webkit',
      },
    },
    {
      name: 'webkit-ios9-ua-like',
      use: {
        browserName: 'webkit',
        viewport: { width: 768, height: 1024 },
        userAgent:
          'Mozilla/5.0 (iPad; CPU OS 9_3_5 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13G36 Safari/601.1',
      },
    },
    {
      name: 'webkit-safari-604-ua',
      use: {
        browserName: 'webkit',
        viewport: { width: 768, height: 1024 },
        userAgent: 'Mozilla/5.0 Safari/604.1',
      },
    },
  ],
});
