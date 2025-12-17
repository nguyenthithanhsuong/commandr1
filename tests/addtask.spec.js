import { test, expect } from '@playwright/test';

// Configuration: Adjust these constants if your test data changes
const TEST_TASK_NAME_FULL = `Full Task`; 
const TEST_TASK_NAME_MINIMAL = `Minimal Task`;
const TEST_DUE_DATE = '2026-01-01';
const TEST_DESCRIPTION = 'Task Description';


// npx playwright test tests/addtask.spec.js

test.describe('Add Task Functionality', () => {

    // --- Helper function for signing in and navigating to the Task List ---
    test.beforeEach(async ({ page }) => {
        // Handle dialogs (alerts)
        page.on('dialog', async dialog => {
            await dialog.accept();
        });
    
        // 1. Navigate to Sign in
        // Use 'domcontentloaded' to wait for basic HTML structure to be ready
        await page.goto('http://localhost:3000/signin', { waitUntil: 'domcontentloaded' }); 
        
        // 2. Wait for the Sign In form elements to be fully ready (CRITICAL FIX FOR INSTABILITY)
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeVisible({ timeout: 10000 }); // Wait for the login button
        
        // 3. Fill and submit
        await page.fill('input[name="email"]', 'admin');
        await page.fill('input[name="password"]', 'admin');
    
        await Promise.all([
            // Expect to navigate to /task or redirect away from /signin
            page.waitForURL(/task|home/, { timeout: 20000 }), 
            page.waitForLoadState('networkidle', { timeout: 20000 }), 
            submitButton.click(),
        ]);

        // 4. Ensure we land on the task page
        if (!page.url().includes('/task')) {
            // Re-try navigation with aggressive wait
            await page.goto('http://localhost:3000/task', { waitUntil: 'networkidle' });
        }
    
        // 5. Verify we're on the task page (FIX FOR TC-AddTask-002 FAILURE)
        const taskHeaderLocator = page.locator('h1:has-text("Task")');
        // This wait should succeed now due to improved login stability
        await expect(taskHeaderLocator).toBeVisible({ timeout: 15000 }); 
    });

    // --- TC-AddTask-001: Success with All Fields ---
    test('TC-AddTask-001: Success - creation with all optional fields filled', async ({ page }) => {
        // ... (TC-001 logic remains the same as it passed)
        // 1. Click 'Add New Task'
        const addTaskButton = page.locator('button:has-text("Add New Task")').first();
        await addTaskButton.click();
    
        await page.waitForURL('**/addtask', { timeout: 10000 });
        
        // Ensure required personnel list is loaded
        const personnelOptions = page.locator('select[name="personnelid"] option');
        await personnelOptions.nth(1).waitFor({ state: 'attached', timeout: 10000 });
        const count = await personnelOptions.count();
        expect(count).toBeGreaterThan(1);
    
        // 2. Input fields
        await page.fill('input[name="taskname"]', TEST_TASK_NAME_FULL);
        await page.selectOption('select[name="personnelid"]', { index: 1 }); // Assigned Personnel (Required)
        await page.fill('input[name="enddate"]', TEST_DUE_DATE);
        await page.selectOption('select[name="projectid"]', { index: 1 }); // Related Project (Optional)
        await page.fill('textarea[name="description"]', TEST_DESCRIPTION);
    
        // 3. Click 'Create Task'
        const submitButton = page.locator('button:has-text("Create Task")').last();
    
        await Promise.all([
            page.waitForURL('**/task', { timeout: 15000 }), 
            submitButton.click(),
        ]);
        
        // Verify success
        await expect(page.locator('h1:has-text("Task")')).toBeVisible();
        await expect(page.locator(`text=${TEST_TASK_NAME_FULL}`)).toBeVisible();
    });

    // --- TC-AddTask-002: Success with Minimal Required Fields ---
    test('TC-AddTask-002: Success - creation with only required fields', async ({ page }) => {
        // ... (TC-002 logic remains the same as it passed in your output, but the beforeEach fix will solve the timeout)
        // 1. Click 'Add New Task'
        const addTaskButton = page.locator('button:has-text("Add New Task")').first();
        await addTaskButton.click();
    
        await page.waitForURL('**/addtask', { timeout: 10000 });
    
        // Ensure required personnel list is loaded
        const personnelOptions = page.locator('select[name="personnelid"] option');
        await personnelOptions.nth(1).waitFor({ state: 'attached', timeout: 10000 });
        const count = await personnelOptions.count();
        expect(count).toBeGreaterThan(1);

        // 2. Input fields
        await page.fill('input[name="taskname"]', TEST_TASK_NAME_MINIMAL);
        await page.selectOption('select[name="personnelid"]', { index: 1 });

        // Skip optional fields
    
        // 3. Click 'Create Task'
        const submitButton = page.locator('button:has-text("Create Task")').last();
    
        await Promise.all([
            page.waitForURL('**/task', { timeout: 15000 }), 
            submitButton.click(),
        ]);
    
        // Verify success
        await expect(page.locator('h1:has-text("Task")')).toBeVisible();
        
        // Your added success message check
        const successMessageLocator = page.locator('text=/successfully|Success|added/i').first();
        await expect(successMessageLocator).toBeVisible({ timeout: 10000 });

        await expect(page.locator(`text=${TEST_TASK_NAME_MINIMAL}`)).toBeVisible();
    });


    // --- TC-AddTask-003: Failure - Missing Required Task Name ---
    test('TC-AddTask-003: Failure - missing required Task Name', async ({ page }) => {
        // 1. Click 'Add New Task'
        const addTaskButton = page.locator('button:has-text("Add New Task")').first();
        await addTaskButton.click();
    
        await page.waitForURL('**/addtask', { timeout: 10000 });

        // Wait for personnel data to load and select one (Required field)
        const personnelOptions = page.locator('select[name="personnelid"] option');
        await personnelOptions.nth(1).waitFor({ state: 'attached', timeout: 10000 });
        await page.selectOption('select[name="personnelid"]', { index: 1 });
    
        // 2. Click 'Create Task' without filling Task Name
        const submitButton = page.locator('button:has-text("Create Task")').last();
        await submitButton.click();
    
        const taskNameInput = page.locator('input[name="taskname"]');
        
        // --- FIX FOR 'toHaveValidationMessage' ERROR ---
        // Since 'toHaveValidationMessage' is not found, we assume an older Playwright version
        // or a non-standard browser/environment setup. We will use a more generic check
        // for an application-specific error message, or check if the form submission failed.

        // Check 1: Verify we did *not* redirect (i.e., we are still on the form)
        await expect(page).toHaveURL(/addtask/, { timeout: 5000 });

        // Check 2 (Fallback): Look for an application-specific error message
        // You MUST confirm what error message your application displays when a required field is missing.
        // Assuming your app shows a general error on the page for an invalid submission:
        const errorMessageLocator = page.locator('text=/Please fill out this field|Task Name is required|Required field/i');
        await expect(errorMessageLocator).toBeVisible({ timeout: 5000 });
    });

    // --- TC-AddTask-004: Failure - Missing Required Personnel ID (Added for completeness) ---
    test('TC-AddTask-004: Failure - missing required Assigned Personnel', async ({ page }) => {
        // 1. Click 'Add New Task'
        const addTaskButton = page.locator('button:has-text("Add New Task")').first();
        await addTaskButton.click();
    
        await page.waitForURL('**/addtask', { timeout: 10000 });

        // Wait for personnel data to load and select the *default* (unselected) option
        const personnelSelect = page.locator('select[name="personnelid"]');
        await page.fill('input[name="taskname"]', 'Task Missing Personnel');
    
        // 2. Click 'Create Task' without selecting Assigned Personnel (it should be at index 0, often 'Select...')
        const submitButton = page.locator('button:has-text("Create Task")').last();
        await submitButton.click();
    
        // Check 1: Verify we did *not* redirect (i.e., we are still on the form)
        await expect(page).toHaveURL(/addtask/, { timeout: 5000 });
        
        // Check 2: Look for an application-specific error message
        const errorMessageLocator = page.locator('text=/Please select an option|Assigned Personnel is required|Required field/i');
        await expect(errorMessageLocator).toBeVisible({ timeout: 5000 });
    });
});