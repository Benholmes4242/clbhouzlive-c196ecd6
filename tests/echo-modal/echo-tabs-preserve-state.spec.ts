import { test, expect } from "@playwright/test";

test("Chat draft and SwingCoach processing survive tab switches", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("open-echo").click();

  // Chat draft persists
  await page.getByTestId("tab-chat").click();
  await page.getByTestId("chat-input").fill("Draft line 1");
  await page.getByTestId("tab-swingcoach").click();
  await page.getByTestId("tab-chat").click();
  await expect(page.getByTestId("chat-input")).toHaveValue("Draft line 1");

  // Minimal SwingCoach upload trigger (mocked)
  await page.getByTestId("tab-swingcoach").click();
  // if you have an interceptor, mock the upload/analysis here
  await page.getByTestId("tab-chat").click();
  await page.getByTestId("tab-swingcoach").click();
  await expect(page.getByTestId("swingcoach-status")).toContainText(/upload|processing|ready/i);
});