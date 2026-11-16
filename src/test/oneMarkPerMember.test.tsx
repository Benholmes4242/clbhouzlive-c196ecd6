import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: () => Promise.resolve({ data: null, error: null }) } }));
vi.mock('@/features/pro-verification/useProMembers', () => ({ useProMembers: (ids: (string | null | undefined)[]) => ({ members: new Map(ids.filter(id => id === 'pro').map(id => [id, { user_id: id, pro_kind: 'tour_pro' }])), isLoading: false }) }));
vi.mock('@/features/pro-verification/proMembersCache', () => ({ cachedProMember: () => null }));
vi.mock('@/features/amateur-ranking/useAmateurMembers', () => ({ useAmateurMembers: (ids: (string | null | undefined)[]) => ({ members: new Set(ids.filter(id => id === 'am')), isLoading: false }) }));

import { ProOrVerifiedMark } from '@/features/pro-verification/ProOrVerifiedMark';

afterEach(cleanup);
const src = (f: string) => readFileSync(resolve(process.cwd(), f), 'utf8');

/** The userId expression each fixed surface passes; business authors pass none. */
const SURFACES: Record<string, (business: boolean, id: string) => string | null | undefined> = {
  'src/features/explore-magazine/watch/CreatorSpotlight.tsx': (business, id) => (business ? undefined : id),
  // The creators row lists personal members only (ExplorePerson has no business actors).
  'src/features/explore-magazine/watch/CreatorsRow.tsx': (_b, id) => id,
  'src/features/explore-magazine/watch/WatchLead.tsx': (business, id) => (business ? undefined : id),
  'src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx': (business, id) => (business ? null : id),
};
const marks = (userId: string | null | undefined) => {
  const client = new QueryClient();
  const { container } = render(<QueryClientProvider client={client}><MemoryRouter><ProOrVerifiedMark userId={userId} verified name="Jay Kelly" /></MemoryRouter></QueryClientProvider>);
  return { pro: container.querySelectorAll('.pro-label:not([data-kind="am"])').length, labels: container.querySelectorAll('.pro-label').length, tick: container.querySelectorAll('svg').length, text: container.textContent };
};

describe('BRIEF_ONE_MARK_PER_MEMBER', () => {
  for (const [file, idFor] of Object.entries(SURFACES)) {
    describe(file, () => {
      it('renders the name mark only through ProOrVerifiedMark, never VerifiedBadge beside a PRO name', () => {
        const s = src(file);
        expect(s).toMatch(/<ProOrVerifiedMark\b/);
        expect(s).not.toMatch(/<VerifiedBadge\b/);
      });
      it('verified pro: PRO only, no tick', () => { const m = marks(idFor(false, 'pro')); expect(m.labels).toBe(1); expect(m.tick).toBe(0); expect(m.text).toBe('PRO'); });
      it('verified amateur: AM only, no tick', () => { const m = marks(idFor(false, 'am')); expect(m.labels).toBe(1); expect(m.tick).toBe(0); expect(m.text).toBe('AM'); });
      it('verified member who is neither: tick only', () => { const m = marks(idFor(false, 'member')); expect(m.labels).toBe(0); expect(m.tick).toBeGreaterThan(0); });
      if (!file.endsWith('CreatorsRow.tsx')) it('verified business (even with a pro id): tick only', () => { const m = marks(idFor(true, 'pro')); expect(m.labels).toBe(0); expect(m.tick).toBeGreaterThan(0); });
    });
  }

  it('guard: no file renders VerifiedBadge beside a ProMemberName person without ProOrVerifiedMark', () => {
    // FindPeoplePage's tick is on its business row only (a different person); kept by brief §2.
    const ALLOWED = new Set(['src/pages/FindPeoplePage.tsx']);
    const walk = (dir: string): string[] => readdirSync(dir).flatMap(n => { const p = join(dir, n); return statSync(p).isDirectory() ? (n === 'test' ? [] : walk(p)) : p.endsWith('.tsx') && !/\.test\.tsx$/.test(p) ? [p] : []; });
    const flagged = walk('src').filter(f => {
      const s = src(f);
      return /import\s*\{[^}]*\bVerifiedBadge\b/.test(s) && /<VerifiedBadge\b/.test(s)
        && /import\s*\{[^}]*\b(?:InlineProMemberName|ProMemberName)\b/.test(s) && !ALLOWED.has(f);
    });
    expect(flagged).toEqual([]);
  });
});
