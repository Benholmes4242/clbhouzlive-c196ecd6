import { describe, expect, it, vi } from 'vitest';
import rank from './fixtures/owgr/mason-rank.json';
import events from './fixtures/owgr/mason-events.json';
import details from './fixtures/owgr/event-11624.json';
import { mondayDates, normalizeFinish, parseRank, parseEvents, parseEventDetails } from '../../supabase/functions/sync-pro-world-rankings/owgrParse';
import { authorized, syncEach, type Pro } from '../../supabase/functions/sync-pro-world-rankings/runSync';
import { eventImportTarget, importedRounds } from '../../supabase/functions/sync-pro-world-rankings/eventImportRules';

describe('OWGR real samples and date rulings', () => {
  it('parses Mason current and previous rank with total points', () => {
    expect(parseRank(rank, 31930)).toEqual({ rank: 1436, priorRank: 1436, points: 1.4686023561587804 });
  });
  it('parses the saved embedded HTML shape', () => {
    expect(parseRank(`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(rank)}</script>`, 31930).rank).toBe(1436);
  });
  it('returns a clean not-ranked error', () => {
    expect(() => parseRank({ ...rank.props.pageProps.playerProfileData.playerProfileData, currentOWGRRank: null }, 31930)).toThrow('Not ranked');
  });
  it('rejects a changed layout and a different player instead of a wrong rank', () => {
    expect(() => parseRank({ rank: 1436 }, 31930)).toThrow('Page layout changed');
    expect(() => parseRank(rank, 123)).toThrow('Page layout changed');
  });
  it.each(['2026-11-02T00:00:00Z', '2026-11-05T22:21:00Z', '2026-11-08T23:59:59Z'])('files only current and preceding Monday at %s', timestamp => {
    expect(mondayDates(new Date(timestamp))).toEqual({ current: '2026-11-02', previous: '2026-10-26' });
  });
  it('crosses the year boundary in UTC correctly', () => {
    expect(mondayDates(new Date('2027-01-01T00:00:00Z'))).toEqual({ current: '2026-12-28', previous: '2026-12-21' });
  });
  it('imports all 39 counting events using id and unadjusted points', () => {
    const parsed = parseEvents(events);
    expect(parsed).toHaveLength(39);
    expect(parsed[0]).toMatchObject({ owgr_event_id: '11624', owgr_year: 2026, owgr_week: 42, owgr_rank_before: 1427, owgr_rank_after: 1426, owgr_points: 0.01752351980698913, tour_name: 'Alps Tour Golf', finish: 'T31', start_date: null });
    expect(parsed[0].owgr_event_id).not.toBe('2110');
  });
  it.each(['T4', '12', 'MC', 'WD', 'DQ'])('normalizes finish %s', finish => expect(normalizeFinish(finish.toLowerCase())).toBe(finish));
  it('reads actual dates/country and gross scores, never invents par or venue', () => {
    expect(parseEventDetails(details, '11624', 31930)).toEqual({ start_date: '2026-10-15', end_date: '2026-10-17', country: 'Belgium', venue: null, to_par: null, total_strokes: 219, scheduled_rounds: 3, rounds: [{ round_no: 1, strokes: 71, to_par: null }, { round_no: 2, strokes: 75, to_par: null }, { round_no: 3, strokes: 73, to_par: null }], grossRounds: [{ round_no: 1, gross: 71 }, { round_no: 2, gross: 75 }, { round_no: 3, gross: 73 }] });
  });
  it('stores event 11624 rounds as unchanged strokes with owgr source and null to-par', () => {
    const parsed = { ...parseEvents(events)[0], ...parseEventDetails(details, '11624', 31930) };
    expect(importedRounds(parsed, [])).toEqual([{ round_no: 1, strokes: 71, to_par: null, source: 'owgr' }, { round_no: 2, strokes: 75, to_par: null, source: 'owgr' }, { round_no: 3, strokes: 73, to_par: null, source: 'owgr' }]);
  });
  it('sums event 11624 gross strokes to 219', () => {
    expect(parseEventDetails(details, '11624', 31930).total_strokes).toBe(219);
  });
  it('reads event 11624 scheduledRoundsCount as three rounds', () => {
    expect(parseEventDetails(details, '11624', 31930).scheduled_rounds).toBe(3);
  });
  it('never includes a member source-pro round in gross import writes', () => {
    const own = [{ round_no: 1, source: 'pro', to_par: -3 }];
    const parsed = { ...parseEvents(events)[0], ...parseEventDetails(details, '11624', 31930) };
    expect(importedRounds(parsed, own)).toEqual([{ round_no: 2, strokes: 75, to_par: null, source: 'owgr' }, { round_no: 3, strokes: 73, to_par: null, source: 'owgr' }]);
    expect(own).toEqual([{ round_no: 1, source: 'pro', to_par: -3 }]);
  });
  it('never merges undated events into own rows', () => {
    expect(eventImportTarget(parseEvents(events)[0], [{ id: 'own', source: 'pro', start_date: '2026-10-15', owgr_event_id: null }])).toBeNull();
  });
  it('skips users who are no longer verified tour pros and isolates one failure', async () => {
    const sources = ['good', 'failed', 'later', 'retired'].map(user_id => ({ user_id, owgr_url: '', owgr_slug: '' }));
    const profiles: Pro[] = sources.map(s => ({ id: s.user_id, pro_kind: s.user_id === 'retired' ? null : 'tour_pro', pro_verified_at: '2026-01-01', pro_player_id: null }));
    const sync = vi.fn(async s => { if (s.user_id === 'failed') throw new Error('Not ranked'); });
    const error = vi.fn(async () => {});
    expect(await syncEach(sources, profiles, sync, error)).toEqual({ checked: 3, updated: 2, failed: [{ user_id: 'failed', error: 'Not ranked' }] });
    expect(sync.mock.calls.map(c => c[0].user_id)).toEqual(['good', 'failed', 'later']);
    expect(error).toHaveBeenCalledOnce();
  });
  it('refuses non-admin callers and accepts admins or service role', async () => {
    expect(await authorized(false, true, async () => false)).toBe(false);
    expect(await authorized(false, false, async () => true)).toBe(false);
    expect(await authorized(false, true, async () => true)).toBe(true);
    expect(await authorized(true, false, async () => false)).toBe(true);
  });
});