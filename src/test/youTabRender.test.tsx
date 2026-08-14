import { describe, it, vi, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import React from 'react';

const state = { worse: false, rounds: 107 };

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  Trans: (p: { children?: unknown }) => p.children ?? null,
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => {
      const short = k.split('.').pop() ?? k;
      const map: Record<string, string> = {
        gapBetterShots: 'Shots better than the field here',
        gapWorseShots: 'Shots worse than the field here',
        gapLevel: 'Level with the field here',
        yours: 'Yours',
        fieldHere: 'The field here',
        youHere: 'You here',
        fieldOnHole: 'Field here',
        avgRound: 'An average round here',
        roundsCount: `${o?.count} rounds`,
        avgGross: 'Avg gross',
        parOrBetterShort: 'Par or better',
        doublesARound: 'Doubles a round',
        roundsLabel: 'Rounds',
        damagingHoles: 'Your most damaging holes',
        byShotsLost: 'By shots lost',
        colHole: 'Hole',
        colCostARound: 'Cost a round',
        s1Sub: 'Par / your avg',
        costingShots: "What's costing you the shots",
        everyHole: 'Every hole',
        parOrBetter: 'Par or better',
        bogey: 'Bogey',
        doubleOrWorse: 'Double or worse',
        nHoles: `${o?.count} holes`,
        doublesFrom: 'Doubles come from',
        roundUnfolds: 'How your round unfolds',
        byThird: 'By third',
        third1: 'Holes 1-6',
        third2: 'Holes 7-12',
        third3: 'Holes 13-18',
        yourBattle: `Your battle · hole ${o?.n}`,
        oneToGoHole: `One to go · hole ${o?.n}`,
        birdieMap: 'Birdie map',
        youBeat: 'Better than most here, but still your worst hole',
        parYouAvg: `Par ${o?.par} · you ${o?.avg}`,
      };
      return map[short] ?? short;
    },
  }),
}));

const holeRows = Array.from({ length: 18 }, (_, i) => ({
  hole_no: i + 1,
  par: 4,
  avg_to_par: 0.4 + (i === 17 ? 0.7 : 0) + (i % 3) * 0.15,
  yardage: 400,
  rounds_played: 900,
}));

vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({
  useCourseHoleAnalysis: () => ({
    data: { available: true, holes: holeRows, total_rounds: 900 },
  }),
}));

vi.mock('@/features/courses/components/holes/useCourseScoringBreakdown', () => ({
  useCourseScoringBreakdown: () => ({
    isLoading: false,
    data: {
      rounds: state.rounds,
      total_over_par: state.worse ? 16.4 : 8.4,
      avg_gross: state.worse ? 88.4 : 80.4,
      holes: Array.from({ length: 18 }, (_, i) => ({
        hole_no: i + 1,
        par: 4,
        rounds_played: state.rounds,
        avg_score: 4.5,
        shots_over_par: (state.worse ? 0.9 : 0.47) + (i === 17 ? 0.6 : 0),
        par_or_better: 40,
        bogeys: 30,
        doubles_plus: 12,
      })),
    },
  }),
}));

describe('you tab', () => {
  it('renders both directions', async () => {
    const { ScoringBreakdownSection } = await import(
      '@/features/courses/components/holes/ScoringBreakdownSection'
    );
    const shots: string[] = [];
    for (const worse of [false, true]) {
      state.worse = worse;
      shots.push(
        renderToStaticMarkup(
          React.createElement(
            'div',
            { style: { width: 390, background: '#F8FAFC', padding: 12 } },
            React.createElement(ScoringBreakdownSection, { golfCourseId: 'c' }),
          ),
        ),
      );
    }
    fs.writeFileSync(
      '/tmp/browser/youtab/out.html',
      `<html><body style="margin:0;font-family:-apple-system,system-ui;display:flex;gap:8px;align-items:flex-start">${shots.join('')}</body></html>`,
    );
    expect(shots[0]).toContain('Shots better than the field here');
    expect(shots[1]).toContain('Shots worse than the field here');
  });
});
