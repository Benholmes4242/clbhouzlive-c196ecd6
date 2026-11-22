import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('news bottom spacers consume canonical clearance once', () => {
  it.each([
    'src/features/tourhub/news/StoryPage.tsx',
    'src/features/amateur/news/AmateurStoryPage.tsx',
    'src/features/amateur/news/AmateurNewsPage.tsx',
  ])('%s uses the nav variable with the canonical fallback and no added inset or breathing term', (path) => {
    const source = readFileSync(path, 'utf8');
    expect(source).toContain("import { NAV_CLEARANCE } from '@/lib/navClearance';");
    const spacer = source.match(/aria-hidden\s+style=\{\{ height: ([^\n]+?) \}\}/)?.[1];
    expect(spacer).toBe('`var(--bottom-nav-height, ${NAV_CLEARANCE})`');
    expect(spacer).not.toContain('env(safe-area-inset-bottom');
    expect(spacer).not.toMatch(/\+\s*16px/);
    expect(source).not.toContain('BOTTOM_SPACER');
  });
});