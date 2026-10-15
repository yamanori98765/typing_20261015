import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:8000', launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' } },
  webServer: { command: 'python3 -m http.server 8000 --bind 127.0.0.1', url: 'http://127.0.0.1:8000', reuseExistingServer: false },
});
