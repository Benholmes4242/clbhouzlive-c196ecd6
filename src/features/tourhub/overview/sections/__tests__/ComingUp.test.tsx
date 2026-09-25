import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComingUp } from '../ComingUp';
import { BrowserRouter } from 'react-router-dom';
import * as useComingUpHook from '../../data/useComingUp';

vi.mock('../../data/useComingUp', () => ({
  useComingUp: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockData = [
  { id: '1', name: 'Tournament 1', start_date: '2025-01-01', end_date: '2025-01-04', venue: 'Venue 1', tour_slug: 'pga', defending_champion: 'Champ 1', isMajor: false },
  { id: '2', name: 'Tournament 2', start_date: '2025-01-08', end_date: '2025-01-11', venue: 'Venue 2', tour_slug: 'lpga', defending_champion: 'Champ 2', isMajor: true },
  { id: '3', name: 'Tournament 3', start_date: '2025-01-15', end_date: '2025-01-18', venue: 'Venue 3', tour_slug: 'euro', defending_champion: null, isMajor: false },
  { id: '4', name: 'Tournament 4', start_date: '2025-01-22', end_date: '2025-01-25', venue: 'Venue 4', tour_slug: 'pga', defending_champion: 'Champ 4', isMajor: false },
  { id: '5', name: 'Tournament 5', start_date: '2025-01-29', end_date: '2025-02-01', venue: 'Venue 5', tour_slug: 'liv', defending_champion: 'Champ 5', isMajor: false },
  { id: '6', name: 'Tournament 6', start_date: '2025-02-05', end_date: '2025-02-08', venue: 'Venue 6', tour_slug: 'pga', defending_champion: 'Champ 6', isMajor: false },
];

describe('ComingUp component', () => {
  it('renders correctly as a rail with 6 items', () => {
    vi.mocked(useComingUpHook.useComingUp).mockReturnValue({
      data: mockData,
      isLoading: false,
    } as any);

    render(
      <BrowserRouter>
        <ComingUp tour="pga" />
      </BrowserRouter>
    );

    // Check title
    expect(screen.getByText('overview.comingUp.title')).toBeDefined();

    // Check if 6 items are rendered (by their names)
    mockData.forEach(item => {
      expect(screen.getByText(item.name)).toBeDefined();
    });

    // Verify it's a horizontal rail (we check for overflowX: auto style on the container)
    // We need to find the container. In the new implementation it will have overflowX: 'auto'.
    const rail = screen.getByRole('list'); // We should use a role or data-testid
    expect(rail.style.overflowX).toBe('auto');
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
  });
});
