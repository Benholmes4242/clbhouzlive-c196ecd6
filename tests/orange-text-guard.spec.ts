/**
 * Orange Text Regression Guard - E2E Test
 * 
 * Ensures orange (#F7931E) is never used for generic text across the app.
 * Orange should ONLY appear in explicit accent components (CTAs, badges, XP).
 */

import { test, expect, Page } from '@playwright/test';

const ORANGE_RGB = 'rgb(247, 147, 30)'; // #F7931E

// Whitelist: CSS selectors where orange text IS allowed
const ACCENT_WHITELIST = [
  '.btn-primary',
  '[data-variant="primary"]',
  '.badge-live',
  '.tag-live',
  '.xp-accent',
  '.achievement-xp',
  '[class*="primary-accent"]',
];

async function ensureNoOrangeText(page: Page) {
  // Get all text nodes
  const textElements = await page.$$('*:not(script):not(style):not(noscript)');

  const violations: string[] = [];

  for (const el of textElements) {
    const text = (await el.textContent())?.trim();
    if (!text || text.length === 0) continue;

    const color = await el.evaluate((node) => {
      const computed = getComputedStyle(node as HTMLElement);
      return computed.color;
    });

    if (color === ORANGE_RGB) {
      // Check if this element is in the whitelist
      const isWhitelisted = await el.evaluate((node, whitelist) => {
        return whitelist.some((selector: string) => 
          (node as HTMLElement).closest(selector) !== null
        );
      }, ACCENT_WHITELIST);

      if (!isWhitelisted) {
        const className = await el.evaluate(n => (n as HTMLElement).className).catch(() => '');
        const tagName = await el.evaluate(n => (n as HTMLElement).tagName).catch(() => '');
        violations.push(`${tagName}.${className}: "${text.substring(0, 50)}"`);
      }
    }
  }

  return violations;
}

test.describe('Orange Text Regression Guard', () => {
  const routes = [
    '/',
    '/hub',
    '/courses',
    '/courses/top-100',
    '/tour',
    '/auth',
  ];

  for (const route of routes) {
    test(`${route} - no generic text uses orange`, async ({ page }) => {
      await page.goto(route);
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      const violations = await ensureNoOrangeText(page);
      
      if (violations.length > 0) {
        console.error('\n❌ Orange text violations found:');
        violations.forEach(v => console.error(`   ${v}`));
      }
      
      expect(violations).toHaveLength(0);
    });
  }
});
