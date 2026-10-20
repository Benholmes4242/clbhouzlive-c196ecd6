/**
 * BRIEF_CONNECT_PANEL_1 (CP1) — the profile page's connect card becomes the
 * empty shape of what connecting fills in.
 *
 * Gate: chip.settled && !chip.connected && isSelf && !hideConnectPrompt.
 * Ghost labels must be labels the CONNECTED hero renders (CP1.2).
 *
 * Mocks are copied whole (react-i18next with initReactI18next; its t honours
 * both default forms, because the hero calls t('key', 'Default')).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (k: string, o?: { defaultValue?: string } | string) => (typeof o === 'string' ? o : o?.defaultValue ?? `[${k}]`) }) }));

const chip = vi.hoisted(() => ({ state: { connected: false, settled: true, connection: null as unknown, trend: null as unknown, anyError: false } }));
const rounds = vi.hoisted(() => ({ data: [] as unknown[] }));

vi.mock('@/lib/whs/hooks', () => ({
  useWhsConnection: () => ({ data: null, isFetched: true, isError: false }),
  useHandicapTrend: () => ({ data: null, isFetched: true, isError: false }),
  useHandicapHistory: () => ({ data: null, isFetched: true, isError: false }),
}));
vi.mock('@/hooks/useHandicapTrend12mo', () => ({ useHandicapTrend12mo: () => ({ delta: null, direction: 'flat' }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => chip.state }));
vi.mock('@/lib/whs/usePercentile', () => ({ useHandicapPercentile: () => ({ data: null }) }));
vi.mock('@/components/profile/rounds/useProfileRounds', () => ({
  useProfileRounds: () => ({ isSuccess: true, data: rounds.data }),
  isFullEighteen: () => true,
}));
vi.mock('@/hooks/gam/useProfileAchievementFigures', () => ({ useProfileAchievementFigures: () => ({ isFetched: true, data: null }) }));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({
  useProfileClubs: () => ({ homeClub: null, secondaryClubs: [], isPrivate: false, isLoading: false }),
}));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: [], isLoading: false }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: vi.fn() }));

import { ProfileHero } from '@/components/profile/hero/ProfileHero';

function renderHero(p: { isSelf?: boolean; hideConnectPrompt?: boolean; indexValue?: number | null } = {}) {
  return render(
    <MemoryRouter>
      <ProfileHero
        userId="u1"
        viewerUserId={p.isSelf === false ? 'u2' : 'u1'}
        displayName="Alex Doe"
        isSelf={p.isSelf ?? true}
        hideConnectPrompt={p.hideConnectPrompt}
        indexValue={p.indexValue ?? null}
        roundsCount={null}
        ratedCount={null}
        onStatTap={() => {}}
        onConnect={() => {}}
      />
    </MemoryRouter>,
  );
}

const panel = () => screen.queryByTestId('hero-connect-panel');

beforeEach(() => {
  chip.state = { connected: false, settled: true, connection: null, trend: null, anyError: false };
  rounds.data = [];
});

describe('CP1 connect panel', () => {
  it('renders for a member with no connection on their own profile', () => {
    renderHero();
    expect(panel()).not.toBeNull();
    expect(panel()!.querySelectorAll('[data-ghost-tile]')).toHaveLength(5);
    expect(panel()!.querySelectorAll('[data-ghost-label]')).toHaveLength(2);
    expect(panel()!.querySelectorAll('button')).toHaveLength(1);
  });

  it('does not render when hideConnectPrompt is true', () => {
    renderHero({ hideConnectPrompt: true });
    expect(panel()).toBeNull();
  });

  it('does not render on someone else\u2019s profile', () => {
    renderHero({ isSelf: false });
    expect(panel()).toBeNull();
  });

  it('does not render for a connected member', () => {
    chip.state = { ...chip.state, connected: true, trend: { current: 12.3 } };
    renderHero({ indexValue: 12.3 });
    expect(panel()).toBeNull();
  });

  it('its ghost labels are labels the connected hero renders', () => {
    const { unmount } = renderHero();
    const ghost = Array.from(panel()!.querySelectorAll('[data-ghost-label]')).map((n) => n.textContent);
    expect(ghost.every((s) => !!s)).toBe(true);
    unmount();

    chip.state = { ...chip.state, connected: true, trend: { current: 12.3 } };
    rounds.data = Array.from({ length: 5 }, (_, i) => ({
      whs_score_id: `r${i}`, play_date: `2026-10-0${i + 1}`, gross_score: 80 + i, handicap_differential: 12 + i, handicap_index_at_time: 12.3,
      course_id: 'c', course_name: 'Course', is_nine_hole: false, is_counter: null,
    }));
    renderHero({ indexValue: 12.3 });
    expect(panel()).toBeNull();
    for (const label of ghost) expect(screen.getAllByText(label!).length).toBeGreaterThan(0);
  });
});
