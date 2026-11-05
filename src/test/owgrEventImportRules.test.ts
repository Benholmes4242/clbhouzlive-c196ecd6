import { describe, expect, it } from 'vitest';
import { eventImportTarget, importedRounds, shouldImportEvents, type OwgrEvent, type StoredEvent } from '../../supabase/functions/sync-pro-world-rankings/eventImportRules';
const event: OwgrEvent = { owgr_event_id: 'official-event', event_name: 'Sample event', tour_name: null, start_date: '2026-10-08', end_date: '2026-10-11', finish: 'T4', owgr_points: 1.2 };
describe('OWGR event import planning', () => {
  it('repeat import selects the same linked identity even with a changed finish', () => {
    const stored: StoredEvent = { id: 'kept', source: 'owgr', start_date: event.start_date, owgr_event_id: event.owgr_event_id };
    expect(eventImportTarget(event, [stored])?.id).toBe('kept');
    expect(eventImportTarget({ ...event, finish: 'T3' }, [stored])?.id).toBe('kept');
  });
  it('converts only an unlinked member event within three days, preserving identity', () => {
    const member: StoredEvent = { id: 'member-event', source: 'pro', start_date: '2026-10-05', owgr_event_id: null };
    expect(eventImportTarget(event, [member])).toBe(member);
    expect(eventImportTarget(event, [{ ...member, start_date: '2026-10-04' }])).toBeNull();
    expect(eventImportTarget(event, [{ ...member, owgr_event_id: 'different' }])).toBeNull();
  });
  it('does not choose an arbitrary event when two member events match the week', () => {
    expect(() => eventImportTarget(event, [{ id: 'a', source: 'pro', start_date: '2026-10-07', owgr_event_id: null }, { id: 'b', source: 'pro', start_date: '2026-10-08', owgr_event_id: null }])).toThrow('Ambiguous same-week event');
  });
  it('imports supplied rounds without replacing any member round', () => {
    expect(importedRounds({ ...event, rounds: [{ round_no: 1, to_par: -3 }, { round_no: 2, to_par: 2 }] }, [{ round_no: 1, source: 'pro' }])).toEqual([{ round_no: 2, to_par: 2, source: 'owgr' }]);
  });
  it('imports no rounds when the source supplies none', () => { expect(importedRounds(event, [])).toEqual([]); });
  it('skips events for Sportradar-linked pros only', () => { expect(shouldImportEvents('sr-player')).toBe(false); expect(shouldImportEvents(null)).toBe(true); });
});