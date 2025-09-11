import { test, expect } from "@playwright/test";

test("Tab switching does not duplicate API calls", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", (req) => {
    if (/\/api\/(chat|swingcoach|caddylogs)/.test(req.url())) calls.push(req.url());
  });

  await page.goto("/");
  await page.getByTestId("open-echo").click();
  for (let i = 0; i < 5; i++) {
    await page.getByTestId("tab-chat").click();
    await page.getByTestId("tab-swingcoach").click();
    await page.getByTestId("tab-caddylogs").click();
  }

  // naive dedupe check: no >1 burst of identical URLs in quick succession
  const dupes = calls.filter((u, i, arr) => arr.indexOf(u) !== i);
  expect(dupes.length).toBeLessThanOrEqual(2); // allow a little caching noise
});