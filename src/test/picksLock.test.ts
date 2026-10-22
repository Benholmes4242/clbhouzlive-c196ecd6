import { beforeEach, describe, expect, it, vi } from 'vitest';
import { picksLockDecision, tournamentAcceptsNewPicks } from '../../supabase/functions/generate-predictions/picksLock';

const f = vi.hoisted(() => ({ from: vi.fn(), invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: f.from, functions: { invoke: f.invoke } },
}));

import { fetchPredictionsForTournament } from '@/features/tourhub/hooks/useAIPredictions';

const tournament = (status: string) => ({
  id: 't1',
  name: 'Test Open',
  venue_name: 'Test GC',
  venue_city: '',
  venue_state: '',
  venue_country: '',
  start_date: '2026-10-22',
  end_date: '2026-10-25',
  purse: 0,
  venue_par: 72,
  venue_yardage: 7200,
  status,
});

// A stored row whose logic_version predates PREDICTION_LOGIC_VERSION — the
// row that used to trigger a mid-tournament regeneration.
const staleRow = {
  predictions: [],
  dark_horses: [],
  course_analysis: {},
  confidence: 0.7,
  logic_version: 1,
  generated_at: '2026-10-20T00:00:00Z',
  research_context: null,
};

function mockAiPredictionsRow(row: unknown) {
  f.from.mockImplementation((table: string) => {
    if (table !== 'ai_predictions') throw new Error(`unexpected table ${table}`);
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: async () => ({ data: row, error: null }),
    };
    return chain;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  f.invoke.mockResolvedValue({
    data: { predictions: { topContenders: [], courseAnalysis: {}, confidence: 0.7 } },
    error: null,
  });
});

describe('CB54 picks lock at the first tee — server decision', () => {
  it.each(['inprogress', 'closed'] as const)(
    "refuses to generate or regenerate for status '%s' and serves the stored row unchanged",
    (status) => {
      expect(tournamentAcceptsNewPicks(status)).toBe(false);
      expect(picksLockDecision(status, true)).toBe('serve-stored');
      expect(picksLockDecision(status, false)).toBe('no-picks');
    },
  );

  it.each(['scheduled', 'created'] as const)("still generates and regenerates for '%s'", (status) => {
    expect(tournamentAcceptsNewPicks(status)).toBe(true);
    expect(picksLockDecision(status, true)).toBe('generate');
    expect(picksLockDecision(status, false)).toBe('generate');
  });
});

describe('CB54 picks lock at the first tee — client', () => {
  it('does not invoke generate-predictions for a started tournament with a stale row', async () => {
    mockAiPredictionsRow(staleRow);
    const result = await fetchPredictionsForTournament(tournament('inprogress'));
    expect(f.invoke).not.toHaveBeenCalled();
    // The stored row is served as it stands, whatever its logic_version.
    expect(result).not.toBeNull();
    expect(result!.generatedAt).toBe('2026-10-20T00:00:00Z');
  });

  it('a started tournament with no row stays without picks', async () => {
    mockAiPredictionsRow(null);
    const result = await fetchPredictionsForTournament(tournament('closed'));
    expect(f.invoke).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('still requests first-time generation for a scheduled tournament', async () => {
    mockAiPredictionsRow(null);
    const result = await fetchPredictionsForTournament(tournament('scheduled'));
    expect(f.invoke).toHaveBeenCalledExactlyOnceWith('generate-predictions', {
      body: { tournamentId: 't1', forceRegenerate: false },
    });
    expect(result).not.toBeNull();
  });

  it('still requests regeneration for a created tournament with a stale row', async () => {
    mockAiPredictionsRow(staleRow);
    await fetchPredictionsForTournament(tournament('created'));
    expect(f.invoke).toHaveBeenCalledExactlyOnceWith('generate-predictions', {
      body: { tournamentId: 't1', forceRegenerate: true },
    });
  });
});
