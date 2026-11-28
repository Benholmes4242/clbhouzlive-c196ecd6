import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
import { OverviewHybridPhoto } from '@/features/tourhub/components/overview-v3/OverviewHybridPhoto';
import type { HeroTournament } from '@/features/tourhub/hooks/useHeroCarouselData';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';

const tm = { id: 't1', name: 'Cup', eventType: 'cup', tourSlug: 'pga', startDate: '2026-12-10T12:00:00Z', endDate: '2026-12-13' } as HeroTournament;
const team = (id: string, name: string) => ({ id, score: null, team: { id, display_name: name } }) as unknown as BoardEntry;
const base = { tournament: tm, state: { kind: 'upcoming' } as never, rows: [], image: null, dates: null, startDay: null, roundState: null, first: null, zone: null, fieldSize: 0, countdown: [{ value: 5, label: 'days' as const }], onOpen: () => {} };

describe('upcoming cup glass card read ruling', () => {
  it('shows the cup card when two team rows arrive', () => {
    const { container } = render(<OverviewHybridPhoto {...base} cupRows={[team('a', 'Europe'), team('b', 'USA')]} />);
    expect(container.querySelector('[data-overview-cup]')).not.toBeNull();
  });
  it('falls back to the standard countdown card with fewer than two team rows or an error', () => {
    for (const cupRows of [[team('a', 'Europe')], null]) {
      const { container, unmount } = render(<OverviewHybridPhoto {...base} cupRows={cupRows} />);
      expect(container.querySelector('[data-overview-cup]')).toBeNull();
      expect(container.querySelector('[data-overview-glass-card]')).not.toBeNull();
      unmount();
    }
  });
  it('mounts the cup read only for upcoming cup slides', () => {
    const src = readFileSync('src/features/tourhub/components/overview-v3/HybridHero.tsx', 'utf8');
    expect(src).toMatch(/state\.kind === 'upcoming' && tournament\.eventType === 'cup' \? UpcomingCupPhoto : OverviewHybridPhoto/);
  });
});
