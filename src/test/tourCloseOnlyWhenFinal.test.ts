/* BRIEF_TOUR_CLOSE_ONLY_WHEN_FINAL — stale date close rule and shortened champion narrative. */
import { describe, expect, it } from 'vitest';
import i18next from 'i18next';
import { readFileSync } from 'node:fs';
import enTourhub from '../../public/locales/en/tourhub.json';
import { shouldDateClose, dateClosePayload, STALE_CLOSE_BACKSTOP_DAYS } from '../../supabase/functions/tournament-live-sync/liveStatus';
import { championNarrative } from '@/features/tourhub/overview/situationCopy';
import type { HeroState } from '@/features/tourhub/components/overview-v3/HybridHero.utils';

const lang = i18next.createInstance();
void lang.init({ lng: 'en', resources: { en: { tourhub: enTourhub } }, initAsync: false, interpolation: { escapeValue: false } });
const t = lang.getFixedT('en', 'tourhub');

const TODAY = '2026-10-26';

describe('stale date close', () => {
  it("feed 'inprogress', end_date yesterday: NOT closed", () => {
    expect(shouldDateClose(false, '2026-10-25', TODAY)).toBe(false);
  });
  it('same event with end_date 4 days ago: closed (backstop)', () => {
    expect(STALE_CLOSE_BACKSTOP_DAYS).toBe(3);
    expect(shouldDateClose(false, '2026-10-22', TODAY)).toBe(true);
    expect(shouldDateClose(false, '2026-10-23', TODAY)).toBe(false);
  });
  it("feed 'closed' (final): closed", () => {
    expect(shouldDateClose(true, '2026-10-25', TODAY)).toBe(true);
  });
  it('a date close never sets winner_id', () => {
    expect(dateClosePayload()).toEqual({ status: 'closed' });
    const src = readFileSync('supabase/functions/tournament-live-sync/index.ts', 'utf8');
    const step1 = src.slice(src.indexOf('// 1. Auto-close stale'), src.indexOf('// 2. Status resolver'));
    expect(step1).toContain('shouldDateClose(');
    expect(step1).toContain('.update(dateClosePayload())');
    expect(step1).toContain(".eq('id', t.id)");
    expect(step1).not.toContain('winner_id');
    expect(step1).not.toMatch(/\.update\(\{ status: 'closed' \}\)/);
  });
});

describe('champion narrative on a finished shortened event', () => {
  const STANDARD: HeroState = { kind: 'results', variant: 'standard', finishDate: '2026-10-25', meta: '' };
  const rows = (played: number) => [0, 1].map(() => ({ round_1: -5, round_2: -6, round_3: played >= 3 ? -5 : null, round_4: played >= 4 ? -2 : null }));
  it('3 of 4 rounds: prefixed with the shortened sentence', () => {
    expect(championNarrative({ state: STANDARD, entries: rows(3), scheduledRounds: 4, narrative: 'Won a playoff.', t }))
      .toBe('Round 4 was cancelled, so the event finished after 54 holes. Won a playoff.');
  });
  it('4 rounds: unchanged', () => {
    expect(championNarrative({ state: STANDARD, entries: rows(4), scheduledRounds: 4, narrative: 'Won a playoff.', t })).toBe('Won a playoff.');
  });
});
