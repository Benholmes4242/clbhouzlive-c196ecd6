/**
 * TOUR SUB-TAB HEADER CRASH FIX — SubTabTourControl rendered `n="chev"`,
 * but TOUR_ICON_PATHS has no 'chev' entry (the down chevron is 'down'), so
 * every Tour sub-tab header threw. These tests pin: each sub-tab header
 * renders without throwing, and TourIcon with an unknown name renders
 * nothing instead of throwing. Structure is asserted, never translated
 * words: the react-i18next mock is the canonical one.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }),
}));

vi.mock('@/features/tourhub/hooks/useTourPickerRows', () => ({
  useTourPickerRows: () => ({ rows: [] }),
}));
vi.mock('@/features/tourhub/hooks/useActiveMensMajor', () => ({
  useActiveMensMajor: () => null,
}));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({
  useLiveTournaments: () => ({ data: [], isFetched: true }),
}));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({
  useTourSelection: () => ({
    selectedTourSlug: 'all',
    viewingTourSlug: null,
    viewingTournamentId: null,
    appliedTourSlug: 'all',
    isSlugAcceptable: () => true,
    selectTour: vi.fn(),
  }),
}));

import { SubTabTourControl } from '@/features/tourhub/pages/TourHubMainPage';
import { TourIcon, TOUR_ICON_PATHS, type TourIconName } from '@/features/tourhub/components/tourIslandIcons';

describe('SubTabTourControl — every Tour sub-tab header renders without throwing', () => {
  for (const tab of ['news', 'live', 'schedule', 'players', 'leaderboards']) {
    it(`renders the ${tab} header`, () => {
      cleanup();
      render(<SubTabTourControl activeTab={tab} onOpen={() => {}} />);
      const button = screen.getByRole('button', { name: 'Change tour' });
      // The down chevron must actually render an svg (the 'chev' bug left none).
      expect(button.querySelector('svg')).not.toBeNull();
    });
  }
});

describe('TourIcon — defensive unknown name', () => {
  it('renders nothing and does not throw for an unknown name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<TourIcon n={'chev' as unknown as TourIconName} />);
    expect(container.firstChild).toBeNull();
    warn.mockRestore();
  });

  it('renders an svg for every declared name', () => {
    for (const name of Object.keys(TOUR_ICON_PATHS) as TourIconName[]) {
      cleanup();
      const { container } = render(<TourIcon n={name} />);
      expect(container.querySelector('svg')).not.toBeNull();
    }
  });
});
