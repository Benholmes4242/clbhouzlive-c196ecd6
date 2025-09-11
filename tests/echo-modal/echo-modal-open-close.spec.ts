import { test, expect } from "@playwright/test";

test("Echo modal opens and matches width spec", async ({ page }) => {
  await page.goto("/");              // adjust route
  await page.getByTestId("open-echo").click();

  const panel = page.getByTestId("ai-overlay-panel"); // or ai-history-panel
  await expect(panel).toBeVisible();

  // Width check (desktop): 90vw cap at 860px
  const width = await panel.evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(860 + 1); // allow 1px rounding

  // Animation settled ~250ms
  await page.waitForTimeout(300);
  const transform = await panel.evaluate((el) => getComputedStyle(el).transform);
  expect(transform).toBe("matrix(1, 0, 0, 1, 0, 0)");

  // Overlay opacity ~0.5
  const overlay = page.getByTestId("ai-history-overlay"); // or ai-overlay-overlay
  const opacity = await overlay.evaluate((el) => getComputedStyle(el).opacity);
  expect(Number(opacity)).toBeGreaterThan(0.45);
});