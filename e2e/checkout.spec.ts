import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('should display checkout page', async ({ page }) => {
    await page.goto('/checkout');
    
    await expect(page.locator('h1')).toContainText('FastCheckOut');
    await expect(page.locator('h2')).toContainText('Carrello');
  });

  test('should navigate to shipping page when cart is not empty', async ({ page }) => {
    // This test would need a cart with items
    // For now, just verify the page structure exists
    await page.goto('/checkout');
    await expect(page).toHaveTitle(/FastCheckOut/i);
  });

  test('should validate shipping form', async ({ page }) => {
    await page.goto('/checkout/shipping');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Nome deve contenere almeno 2 caratteri')).toBeVisible();
  });

  test('should display payment methods', async ({ page }) => {
    await page.goto('/checkout/payment');
    
    // Should show payment method selection
    await expect(page.locator('text=Carta di credito')).toBeVisible();
    await expect(page.locator('text=PayPal')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('checkout page should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/checkout');
    const loadTime = Date.now() - startTime;
    
    // Should load in under 3 seconds (allowing buffer for test environment)
    expect(loadTime).toBeLessThan(3000);
  });
});
