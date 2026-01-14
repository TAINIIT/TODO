import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
    // Increase timeout for this setup
    setup.setTimeout(120000);

    // Go to login page
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Wait for login form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill credentials
    await page.fill('input[type="email"]', 'test@tsb.com.vn');
    await page.fill('input[type="password"]', 'Password123!');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation away from login page
    // Either to dashboard or tasks - just wait for URL to change from /login
    await page.waitForFunction(
        () => !window.location.pathname.includes('/login'),
        { timeout: 60000 }
    );

    // Wait a bit for the page to stabilize
    await page.waitForTimeout(2000);
    await page.waitForLoadState('domcontentloaded');

    // Save authentication state
    await page.context().storageState({ path: authFile });

    console.log('✅ Authentication state saved!');
});
