import { test, expect } from '@playwright/test';

// List of navigation links to test
const navigationLinks = [
  { name: 'Personnel', href: '/personnel' },
  { name: 'Attendance', href: '/attendance' },
  { name: 'Request', href: '/request' },
  { name: 'Task', href: '/task' },
  { name: 'Project', href: '/project' },
  { name: 'Department', href: '/department' },
  { name: 'Report', href: '/report' },
];

test.describe('Navigation after login', () => {
  test.beforeEach(async ({ page }) => {
    // Handle dialogs (alerts)
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // Go to sign-in page
    await page.goto('http://localhost:3000/signin', { waitUntil: 'networkidle' });

    // Fill in credentials
    await page.fill('input[name="email"]', 'admin');
    await page.fill('input[name="password"]', 'admin');

    // Click submit and wait for navigation
    await Promise.all([
      page.waitForURL('**/personnel', { timeout: 20000 }),
      page.click('button[type="submit"]'),
    ]);

    // Verify we're on the personnel page
    await expect(page.locator('text=Personnel')).toBeVisible();
  });

  // Test each navigation link
  navigationLinks.forEach(({ name, href }) => {
    test(`should navigate to ${name} (${href})`, async ({ page }) => {
      // Click the navigation link
      const navLink = page.locator(`span:has-text("${name}")`).first();
      
      await navLink.click();

      // Wait for navigation to complete
      await page.waitForURL(`**${href}`, { timeout: 10000 });

      // Verify the URL changed
      expect(page.url()).toContain(href);

      // Optionally: verify page loaded (you can add specific checks per page if needed)
      // For now, just ensure no errors and the page is responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('should navigate through multiple links in sequence', async ({ page }) => {
    // Test sequential navigation through all links
    for (const { name, href } of navigationLinks) {
      const navLink = page.locator(`span:has-text("${name}")`).first();
      await navLink.click();
      await page.waitForURL(`**${href}`, { timeout: 10000 });
      expect(page.url()).toContain(href);
    }
  });

  test('should return to Personnel from any navigation link', async ({ page }) => {
    // Go to another page first
    const taskLink = page.locator(`span:has-text("Task")`).first();
    await taskLink.click();
    await page.waitForURL('**/task', { timeout: 10000 });
    expect(page.url()).toContain('/task');

    // Navigate back to Personnel
    const personnelLink = page.locator(`span:has-text("Personnel")`).first();
    await personnelLink.click();
    await page.waitForURL('**/personnel', { timeout: 10000 });
    expect(page.url()).toContain('/personnel');
  });
});
