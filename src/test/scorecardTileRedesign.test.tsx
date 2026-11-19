import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import courses from '../../src/locales/en/courses.json';

vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: undefined }) }));
vi.mock('@/components/posts/useReviewMedia', () => ({ useReviewMedia: () => ({ data: [] }) }));
vi.mock('@/components/posts/useReviewPost', () => ({ useReviewPost: () => ({ data: undefined }) }));
vi.mock('@/hooks/useReviewFallback', () => ({ useReviewFallback: () => ({ data: null }) }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: () => null }));
vi.mock('@/features/courses/_shared/scorecard/ScorecardGlassOverlay', () => ({ ScorecardGlassOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import { CardScorecardSheet } from '@/features/courses/_shared/scorecard/CardScorecardSheet';
import { RoundResults } from '@/features/courses/_shared/scorecard/RoundResults';

const i18n = createInstance();
void i18n.init({ lng: 'en', resources: { en: { courses } }, interpolation: { escapeValue: false } });
function mount(node: React.ReactNode) {
  return render(<MemoryRouter><I18nextProvider i18n={i18n}>{node}</I18nextProvider></MemoryRouter>);
}
const holes = Array.from({ length: 18 }, (_, i) => ({ holeNo: i + 1, par: 4, strokes: i === 0 ? 3 : 4, played: true }));
const base = { open: true, onClose: vi.fn(), eyebrowText: '', courseName: 'Sundridge Park (East)', courseLocation: 'Kent, England', playerName: 'Mike M', playerUserId: 'other', holes, presentation: 'page' as const };
const effort = (unit_kind: string, value: number, rank_here: number | null = null) => ({ unit_kind, value, rank_here, top_ten: rank_here != null, attempts: 10 });
const awardsWith = { awards: [], efforts: [effort('round_stableford', 36), effort('round_gross', 73, 1)] } as never;
const ctx = { roundsHere: 6, rankHere: 2, avgToParOthers: 4, indexAtTime: 8.4, differential: 5.1 };
const cellKeys = () => Array.from(document.querySelectorAll('[data-round-score-row] [data-score-cell]')).map((n) => n.getAttribute('data-score-cell'));
afterEach(cleanup);

describe('SCORECARD_TILE_REDESIGN', () => {
  it('(a) header: kicker, two-line course name, player row with chevron, no pills; taps reach the handlers', () => {
    const course = vi.fn(); const profile = vi.fn();
    mount(<CardScorecardSheet {...base} onViewCourse={course} onViewProfile={profile} />);
    expect(document.querySelector('[data-scorecard-kicker]')?.textContent).toContain('Kent, England');
    const name = document.querySelector('button[data-scorecard-course-name]') as HTMLElement;
    expect(name.style.overflow).toBe('hidden'); // jsdom drops -webkit-line-clamp; the clamp is checked in the browser
    expect(document.querySelector('[data-scorecard-player-chevron]')).not.toBeNull();
    expect(document.querySelector('[data-sheet-door]')).toBeNull();
    fireEvent.click(name); fireEvent.click(document.querySelector('button[data-scorecard-player-row]')!);
    expect(course).toHaveBeenCalledOnce(); expect(profile).toHaveBeenCalledOnce();
  });

  it('(b) member score row: GROSS then only cells with data; tour: TO PAR then identity stat', () => {
    mount(<CardScorecardSheet {...base} roundResults={awardsWith} courseContext={ctx} />);
    expect(cellKeys()).toEqual(['gross', 'toPar', 'points', 'diff', 'playedOff']);
    cleanup();
    mount(<CardScorecardSheet {...base} roundResults={awardsWith} courseContext={{ ...ctx, differential: null }} />);
    expect(cellKeys()).toEqual(['gross', 'toPar', 'points', 'playedOff']);
    cleanup();
    mount(<CardScorecardSheet {...base} surface="tour" identityStat={{ value: 'T4', label: 'POS' }} courseContext={ctx} roundResults={awardsWith} />);
    expect(cellKeys()).toEqual(['gross', 'toPar', 'identity']);
  });

  it('(c) comparison line: both halves with data, each half dropped on missing data', () => {
    mount(<CardScorecardSheet {...base} courseContext={ctx} />);
    const parts = () => Array.from(document.querySelectorAll('[data-scorecard-comparison] [data-comparison-part]')).map((n) => n.getAttribute('data-comparison-part'));
    expect(parts()).toEqual(['rank', 'vsavg']);
    cleanup();
    mount(<CardScorecardSheet {...base} courseContext={{ ...ctx, avgToParOthers: null }} />);
    expect(parts()).toEqual(['rank']);
    cleanup();
    mount(<CardScorecardSheet {...base} courseContext={{ ...ctx, avgToParOthers: null, rankHere: null }} />);
    expect(document.querySelector('[data-scorecard-comparison]')).toBeNull();
  });

  it('(d) two glass nines with totals and marks; one for a nine-hole round', () => {
    mount(<CardScorecardSheet {...base} />);
    const nines = document.querySelectorAll('[data-scorecard-nine]');
    expect(nines).toHaveLength(2);
    expect(nines[0].querySelector('[data-nine-total="strokes"]')?.textContent).toBe('35');
    expect(nines[1].querySelector('[data-nine-total="strokes"]')?.textContent).toBe('36');
    expect(nines[0].querySelectorAll('[data-nine-cell="strokes"]')).toHaveLength(9);
    cleanup();
    mount(<CardScorecardSheet {...base} holes={holes.slice(0, 9)} />);
    expect(document.querySelectorAll('[data-scorecard-nine]')).toHaveLength(1);
  });

  it('(e) efforts table: no green; a first is bold ink, others are not', () => {
    const { container } = render(<RoundResults result={{ awards: [], efforts: [effort('round_gross', 73, 1), effort('front_nine', 36, 3)] } as never} scope={null} />);
    const first = container.querySelector('[data-round-effort-first="true"]') as HTMLElement;
    expect(first.style.fontWeight).toBe('700');
    const other = container.querySelector('[data-round-effort="front_nine"] [data-round-effort-placing]') as HTMLElement;
    expect(other.style.fontWeight).toBe('600');
    expect(container.innerHTML).not.toMatch(/#22C55E|#16A34A|rgb\(34, 197, 94\)/i);
  });

  it('(f) footer is one row with no comment preview', () => {
    mount(<CardScorecardSheet {...base} onShareRound={vi.fn()} />);
    const foot = document.querySelector('[data-scorecard-footer]') as HTMLElement;
    expect(foot.style.display).toBe('flex');
    expect(document.querySelector('[data-feed-comment-preview], [data-comment-preview]')).toBeNull();
    expect(foot.querySelectorAll(':scope > div[style*="column"]')).toHaveLength(0);
  });

  it('(g) 320 structure: nines and score row cannot overflow horizontally', () => {
    mount(<div style={{ width: 320 }}><CardScorecardSheet {...base} courseContext={ctx} roundResults={awardsWith} /></div>);
    for (const nine of Array.from(document.querySelectorAll('[data-scorecard-nine]')) as HTMLElement[]) {
      expect(nine.style.gridTemplateColumns).toContain('minmax(0, 1fr)');
      expect(nine.style.minWidth).toBe('0');
    }
    const breakdown = document.querySelector('[data-round-score-row] [data-score-breakdown]') as HTMLElement;
    expect(breakdown.style.justifyContent).toBe('space-between');
    expect(document.querySelector('[data-round-score-container-rules]')?.textContent).toContain('max-width: 330px');
  });
});

describe('SCORECARD_TILE · NET IN THE SCORE ROW', () => {
  it('(a) nettable member round: GROSS, TO PAR, NET, POINTS, DIFF and no PLAYED OFF', () => {
    mount(<CardScorecardSheet {...base} roundResults={awardsWith} courseContext={ctx} net={70} courseHandicap={9} />);
    expect(cellKeys()).toEqual(['gross', 'toPar', 'net', 'points', 'diff']);
  });
  it('(b) no course handicap: TO PAR, POINTS, DIFF, PLAYED OFF and no NET', () => {
    mount(<CardScorecardSheet {...base} roundResults={awardsWith} courseContext={ctx} net={70} courseHandicap={null} />);
    expect(cellKeys()).toEqual(['gross', 'toPar', 'points', 'diff', 'playedOff']);
    cleanup();
    mount(<CardScorecardSheet {...base} roundResults={awardsWith} courseContext={ctx} net={70} courseHandicap={9} netAllowanceOk={false} />);
    expect(cellKeys()).not.toContain('net');
  });
  it('(c) NET is the passed value; the sheet holds no gross-minus-handicap arithmetic', async () => {
    mount(<CardScorecardSheet {...base} courseContext={ctx} net={61} courseHandicap={9} />);
    expect(document.querySelector('[data-score-cell="net"] [data-score-figure]')?.textContent).toBe('61');
    const fs = await import('node:fs');
    const src = fs.readFileSync('src/features/courses/_shared/scorecard/CardScorecardSheet.tsx', 'utf8');
    expect(src).not.toMatch(/gross\w*\s*-\s*\(?\s*courseHandicap/i);
    expect(src).not.toMatch(/courseHandicap\s*[-+]/);
  });
  it('(d) tour renders no NET', () => {
    mount(<CardScorecardSheet {...base} surface="tour" identityStat={{ value: 'T4', label: 'POS' }} net={70} courseHandicap={9} />);
    expect(cellKeys()).toEqual(['gross', 'toPar', 'identity']);
  });
  it('(e) 320: the five-figure row keeps its narrow-width rules', () => {
    mount(<CardScorecardSheet {...base} roundResults={awardsWith} courseContext={ctx} net={70} courseHandicap={9} />);
    const rules = document.querySelector('[data-round-score-container-rules]')?.textContent ?? '';
    expect(rules).toContain('max-width: 330px');
    expect(document.querySelectorAll('[data-round-score-row] [data-score-cell]').length).toBe(5);
  });
});
