/**
 * BRIEF_PROFILE_BIO_FULL — the profile hero bio shows whole.
 *
 * The collapsed clamp is eight lines (BIO_COLLAPSED_LINES), which covers every
 * bio the editor allows (BIO_MAX 300), so a within-limit bio needs no control.
 * The More / Less button stays measurement-driven: ProfilePageV2 sets
 * bioOverflows from scrollHeight vs clientHeight, so only a longer legacy bio
 * ever offers it.
 *
 * Mocks are copied whole (react-i18next with initReactI18next, required at
 * module load; its t honours both default forms, because the hero calls
 * t('hero.more', 'More')). Assertions are on inline style and button presence.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string } | string) => (typeof o === 'string' ? o : o?.defaultValue ?? '') }) }));

vi.mock('@/lib/whs/hooks', () => ({
  useWhsConnection: () => ({ data: null, isFetched: true, isError: false }),
  useHandicapTrend: () => ({ data: null, isFetched: true, isError: false }),
  useHandicapHistory: () => ({ data: null, isFetched: true, isError: false }),
}));
vi.mock('@/hooks/useHandicapTrend12mo', () => ({ useHandicapTrend12mo: () => ({ delta: null, direction: 'flat' }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({
  useHandicapChipState: () => ({ connected: false, settled: true, connection: null, trend: null, anyError: false }),
}));
vi.mock('@/lib/whs/usePercentile', () => ({ useHandicapPercentile: () => ({ data: null }) }));
vi.mock('@/components/profile/rounds/useProfileRounds', () => ({
  useProfileRounds: () => ({ isSuccess: true, data: [] }),
  isFullEighteen: () => false,
}));
vi.mock('@/hooks/gam/useProfileAchievementFigures', () => ({ useProfileAchievementFigures: () => ({ isFetched: true, data: null }) }));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({
  useProfileClubs: () => ({ homeClub: null, secondaryClubs: [], isPrivate: false, isLoading: false }),
}));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: [], isLoading: false }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: vi.fn() }));

import { ProfileHero, BIO_COLLAPSED_LINES } from '@/components/profile/hero/ProfileHero';
import { BIO_MAX } from '@/components/profile/profile-wizard/types';

/** Exactly the editor limit: 'clbhouz bio ' is 12 characters, 25 of them = 300. */
const BIO_300 = 'clbhouz bio '.repeat(BIO_MAX / 12);

function renderHero({
  bio = BIO_300,
  bioOverflows = false,
  bioExpanded = false,
}: { bio?: string | null; bioOverflows?: boolean; bioExpanded?: boolean } = {}) {
  const bioRef = React.createRef<HTMLDivElement>();
  render(
    <MemoryRouter>
      <ProfileHero
        userId="u1"
        displayName="Alex Doe"
        isSelf
        indexValue={null}
        roundsCount={null}
        ratedCount={null}
        onStatTap={() => {}}
        bio={bio}
        bioRef={bioRef}
        bioOverflows={bioOverflows}
        bioExpanded={bioExpanded}
        onToggleBio={() => {}}
      />
    </MemoryRouter>,
  );
  return bioRef;
}

describe('profile hero bio shows whole', () => {
  it('the bio fixture is exactly the 300-character editor limit', () => {
    expect(BIO_300).toHaveLength(BIO_MAX);
  });

  it('a bio at the editor limit collapses to eight lines, not two', () => {
    expect(BIO_COLLAPSED_LINES).toBe(8);
    const bioRef = renderHero();
    const style = bioRef.current?.style;
    expect(style?.getPropertyValue('-webkit-line-clamp')).toBe('8');
    expect(style?.display).toBe('-webkit-box');
    expect(style?.getPropertyValue('-webkit-box-orient')).toBe('vertical');
    expect(style?.overflow).toBe('hidden');
    expect(bioRef.current?.textContent).toBe(BIO_300);
  });

  it('the expanded bio lifts the clamp', () => {
    const bioRef = renderHero({ bioExpanded: true });
    expect(bioRef.current?.style.getPropertyValue('-webkit-line-clamp')).toBe('');
    expect(bioRef.current?.style.display).not.toBe('-webkit-box');
  });

  it('no More and no Less while the bio measures inside the clamp', () => {
    renderHero();
    expect(screen.queryByRole('button', { name: 'More' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Less' })).toBeNull();
  });

  it('More appears only when the measurement says the bio overflows', () => {
    renderHero({ bioOverflows: true });
    expect(screen.getByRole('button', { name: 'More' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Less' })).toBeNull();
  });

  it('Less appears only once the bio is expanded', () => {
    renderHero({ bioOverflows: true, bioExpanded: true });
    expect(screen.getByRole('button', { name: 'Less' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'More' })).toBeNull();
  });
});
