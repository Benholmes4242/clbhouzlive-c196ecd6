/**
 * BRIEF_PROFILE_ACHIEVEMENTS_REAL — proof the pane states stored figures and
 * nothing else: two different members render two different sets of figures, a
 * member with nothing renders an honest line (not zeros in a progress bar),
 * and a failed read renders an em dash rather than a confident zero.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AchievementsPane from '@/components/profile/AchievementsPane';

const figures = vi.fn();

vi.mock('@/hooks/gam/useProfileAchievementFigures', () => ({
  useProfileAchievementFigures: (userId?: string) => figures(userId),
}));

vi.mock('@/utils/analyticsEvents', () => ({
  analyticsEvents: { track: vi.fn() },
}));

const ok = (badges: number, titles: number) => ({
  data: { badges, titles },
  isError: false,
  isFetched: true,
});

function draw() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AchievementsPane userId="u1" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const value = (id: string) =>
  document.querySelector(`[data-figure-value="${id}"]`)?.textContent;

describe('AchievementsPane', () => {
  beforeEach(() => figures.mockReset());

  it('prints each member their own stored figures', async () => {
    figures.mockReturnValue(ok(24, 34));
    const first = draw();
    await waitFor(() => expect(value('badges')).toBe('24'));
    expect(value('titles')).toBe('34');
    first.unmount();

    figures.mockReturnValue(ok(23, 56));
    draw();
    await waitFor(() => expect(value('badges')).toBe('23'));
    expect(value('titles')).toBe('56');
  });

  it('shows an honest line, not zeros, for a member with nothing', async () => {
    figures.mockReturnValue(ok(0, 0));
    draw();
    await waitFor(() =>
      expect(document.querySelector('[data-achievements-empty]')).not.toBeNull(),
    );
    expect(document.querySelector('[data-figure-value="badges"]')).toBeNull();
    expect(screen.getByLabelText('Open the Trophy Room')).toBeTruthy();
  });

  it('prints an em dash when the read fails or has not run', async () => {
    figures.mockReturnValue({ data: undefined, isError: true, isFetched: true });
    draw();
    await waitFor(() => expect(value('badges')).toBe('—'));
    expect(value('titles')).toBe('—');
  });

  it('never claims a tier, a level or XP', async () => {
    figures.mockReturnValue(ok(24, 34));
    const { container } = draw();
    await waitFor(() => expect(value('badges')).toBe('24'));
    expect(container.textContent).not.toMatch(/XP|Ring|Level|Tier/i);
  });
});
