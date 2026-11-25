import { describe, it, expect } from 'vitest';
import { scorecardsInvokeBody } from '../../supabase/functions/tournament-round-complete/scorecardsBody';
describe('Brief 21B A — round-complete asks for one round on the right tour', () => {
  it('a finished DP World round carries roundNumber and tourId euro, and no round key', () => {
    const body = scorecardsInvokeBody('sr:t:1', 3, 2026, 'EURO');
    expect(body).toEqual({ action: 'scorecards', tournamentId: 'sr:t:1', roundNumber: 3, tourId: 'euro', year: 2026 });
    expect('round' in body).toBe(false);
  });
});
