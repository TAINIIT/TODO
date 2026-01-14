import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, 'tests/.auth/user.json');

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 1 : 4,
    reporter: 'html',

    // Global timeout settings
    timeout: 60000,
    expect: {
        timeout: 10000,
    },

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        navigationTimeout: 30000,
        actionTimeout: 15000,
    },

    projects: [
        // Setup project - runs first to authenticate
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },

        // Main tests - use authenticated state
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: authFile,
            },
            dependencies: ['setup'],
        },

        {
            name: 'Mobile Safari',
            use: {
                ...devices['iPhone 13'],
                storageState: authFile,
            },
            dependencies: ['setup'],
        },
    ],

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
