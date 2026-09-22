import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { resolveChrome } from '@/features/chrome-v2/registry';

const source = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

describe('round notifications open the scorecard over Activity', () => {
  it('gives a cold round address back chrome with the page fallback and no HCP cell', () => {
    expect(resolveChrome('/round/score-1', new URLSearchParams())).toEqual({
      chrome: 'island',
      left: {
        kind: 'back',
        title: null,
        backTarget: 'history',
        backFallback: '/handicap',
      },
      tone: 'dark',
      bleed: false,
      hideHcp: true,
    });
  });

  it('adds shared chrome clearance only to the scorecard page branch', () => {
    const overlay = source('src/features/courses/_shared/scorecard/ScorecardGlassOverlay.tsx');
    const pageBranch = overlay.slice(
      overlay.indexOf("if (presentation === 'page')"),
      overlay.indexOf('if (!mounted) return null;'),
    );
    const floatingBranch = overlay.slice(overlay.indexOf('if (!mounted) return null;'));

    expect(pageBranch).toContain('paddingTop: CHROME_CLEARANCE');
    expect(floatingBranch).not.toContain('paddingTop: CHROME_CLEARANCE');
  });

  it('preserves the comments query while navigating every round over the list', () => {
    const ledger = source('src/features/activity-v2/components/LedgerRow.tsx');

    expect(ledger).toContain("const opensOverList = opensReviewWizard || url.startsWith('/round/');");
    expect(ledger).toContain('navigate(url, { state: { backgroundLocation: location } });');
  });

  it('uses one RoundPage for overlay and cold-page presentations', () => {
    const page = source('src/pages/RoundPage.tsx');
    const app = source('src/App.tsx');

    expect(page).toContain('const asOverlay = Boolean(');
    expect(page).toContain("if (pending) return asOverlay ? null : <RoundPageSkeleton />;");
    expect(page).toContain("presentation={asOverlay ? 'overlay' : 'page'}");
    expect(page).toContain('return asOverlay ? sheet : (');
    expect(page).toContain('initialCommentsOpen={openCommentsRequested}');
    expect(app.match(/path="\/round\/:whsScoreId"/g)).toHaveLength(2);
    expect(app).toContain('<Suspense fallback={<RoundPageSkeleton />}><RoundPage /></Suspense>');
  });
});