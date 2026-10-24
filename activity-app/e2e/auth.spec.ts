import { expect, test } from '@playwright/test';

test('the root and protected dashboard routes require authentication', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome Back!' })).toBeVisible();

  for (const route of ['/dashboard', '/dashboard/my-activities', '/dashboard/profile']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome Back!' })).toBeVisible();
  }
});

test('registration requires a valid phone number and sends all RegisterRequest fields', async ({ page }) => {
  let registrationPayload: Record<string, unknown> | undefined;
  await page.route('**/auth/register', async (route) => {
    registrationPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'e17c2f58-419d-4bf9-867e-3e3600302428',
        full_name: 'Vaishnavi Test',
        email: 'vaishnavi.assessment@example.com',
        phone_number: '+919876543210',
        location: null,
      }),
    });
  });

  await page.goto('/register');
  await page.locator('input[name="fullName"]').fill('Vaishnavi Test');
  await page.locator('input[name="email"]').fill('vaishnavi.assessment@example.com');
  await expect(page.locator('input[name="phoneNumber"]')).toHaveAttribute('required', '');
  await page.locator('input[name="phoneNumber"]').fill('+91 98765 43210');
  await page.locator('input[name="password"]').fill('AssessmentPass123!');
  await page.locator('input[name="confirmPassword"]').fill('AssessmentPass123!');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Create Account & Join Local Vibes/ }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('[role="alert"][aria-live="polite"]'))
    .toContainText('Account created successfully.');
  expect(registrationPayload).toEqual({
    full_name: 'Vaishnavi Test',
    email: 'vaishnavi.assessment@example.com',
    phone_number: '+919876543210',
    password: 'AssessmentPass123!',
  });
});

test('failed login displays the backend authentication error', async ({ page }) => {
  let requestMethod: string | undefined;
  await page.route('**/auth/login', async (route) => {
    requestMethod = route.request().method();
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Invalid email or password' }),
    });
  });

  await page.goto('/login');
  await page.locator('input[name="loginEmail"]').fill('unknown@example.com');
  await page.locator('input[name="loginPassword"]').fill('IncorrectPass123!');
  await page.getByRole('button', { name: 'Log In to Your Vibe' }).click();

  await expect(page.locator('[role="alert"][aria-live="polite"]'))
    .toContainText('Invalid email or password');
  await expect(page).toHaveURL(/\/login$/);
  expect(requestMethod).toBe('POST');
});
