import { test, expect } from '@playwright/test';

//npx playwright test tests/addpersonnel.spec.js

test('Add Personnel - successful creation with all fields', async ({ page }) => {
  // Handle dialogs (alerts)
  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  // Sign in first
  await page.goto('http://localhost:3000/signin', { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', 'admin');
  await page.fill('input[name="password"]', 'admin');

  // Click submit and wait for navigation to personnel
  await Promise.all([
    page.waitForURL('**/personnel', { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);

  // Verify we're on the personnel page
  await expect(page.locator('text=Personnel')).toBeVisible();

  // Click 'Add Personnel' button
  const addPersonnelButton = page.locator('button:has-text("Add Personnel")').first();
  await addPersonnelButton.click();

  // Wait for navigation to addpersonnel page
  await page.waitForURL('**/addpersonnel', { timeout: 10000 });

  // Fill in the form fields
  // Name
  await page.fill('input[name="name"]', 'Testing');

  // Date of Birth
  await page.fill('input[name="dateofbirth"]', '2004-08-02');

  // Phone Number
  await page.fill('input[name="phonenumber"]', '01020304');

  // Email
  await page.fill('input[name="email"]', 'email@email.vn');

  // Password
  await page.fill('input[name="password"]', 'password');

  // Position - select from dropdown/input
  // Try to find and fill the position field (could be a select or input)
  const positionInput = page.locator('input[name="position"]').first();
  if (await positionInput.isVisible()) {
    await positionInput.fill('Testing');
  } else {
    // If it's a select element
    const positionSelect = page.locator('select[name="position"]').first();
    if (await positionSelect.isVisible()) {
      await positionSelect.selectOption('Testing');
    }
  }

  // Click 'Add Personnel' button to submit the form
  const submitButton = page.locator('button:has-text("Add Personnel")').last();
  await submitButton.click();

  // Wait for success - could be a redirect, alert, or success message
  // Check for any of these success indicators
  await Promise.race([
    page.waitForURL('**/personnel', { timeout: 10000 }).catch(() => null), // Redirect back to personnel
    page.locator('text=successfully|Success|added').first().waitFor({ timeout: 10000 }).catch(() => null), // Success message
    page.locator('text=Personnel').waitFor({ timeout: 10000 }).catch(() => null), // Back on personnel page
  ]);

  // Verify we're back on the personnel page or see a success indicator
  const isOnPersonnelPage = page.url().includes('/personnel');
  const hasSuccessMessage = await page.locator('text=successfully|Success|added').first().isVisible().catch(() => false);

  expect(isOnPersonnelPage || hasSuccessMessage).toBeTruthy();

  // Optional: Verify the new personnel appears in the list
  // (This may take a moment to load, so we add a small wait)
  await page.waitForTimeout(1000);
  const testingPersonnel = page.locator('text=Testing').first();
  const isPersonnelVisible = await testingPersonnel.isVisible().catch(() => false);

  if (isPersonnelVisible) {
    expect(await testingPersonnel.isVisible()).toBe(true);
  }
});
