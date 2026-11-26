import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/tourhub/hooks/useEffectiveRound', () => ({ useEffectiveRound: () => 1 }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));

import { LinkedLiveCard } from '@/features/pro-profile/LinkedProSections';

const data = {
  tournament_id: 'event-1', position: 1, position_tied: false, score: -2, thru: 4, today: -2,
  tournament: { name: 'Test Open', status: 'inprogress', current_round: 1, venue_course_name: 'Test Course', venue_name: null },
  holes: [],
};

describe('Brief 37A live-round wording', () => {
  it('visitor uses the supplied first name without his', () => {
    render(<LinkedLiveCard data={data} playerId="player-1" name="Mason Smith" first="Mason" tour="PGA" />);
    const button = screen.getByRole('button', { name: "Follow Mason's round, shot by shot" });
    expect(button.textContent).toBe("Follow Mason's round, shot by shot");
    expect(button.textContent).not.toMatch(/\bhis\b/i);
  });
  it('owner uses your without his', () => {
    render(<LinkedLiveCard data={data} playerId="player-1" name="Mason Smith" first="Mason" tour="PGA" owner />);
    const button = screen.getByRole('button', { name: 'Follow your round, shot by shot' });
    expect(button.textContent).toBe('Follow your round, shot by shot');
    expect(button.textContent).not.toMatch(/\bhis\b/i);
  });
});
