/**
 * BRIEF_PROFILE_COVER_FALLBACK — a member's cover falls back in a fixed order:
 * their own cover photo → the home club's own course photo → the #1 Top 10
 * course thumbnail → the fairway contours. A cover that fails to load falls
 * back to the contours too, the business hero falls back to contours plus the
 * shared fade, and the own-profile "+ Add a cover" pill opens the existing
 * cover picker through /edit-profile?src=cover.
 *
 * react-i18next is mocked whole (initReactI18next is required at module load);
 * its t returns the defaultValue the hero passes. The supabase client is
 * mocked with a chainable thenable so the real useClubCoverPhoto rule — and
 * the fact that it is only read while no own cover exists — is exercised.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string } | string) => (typeof o === 'string' ? o : o?.defaultValue ?? '') }) }));

const db = vi.hoisted(() => ({
  clubRows: [] as { thumbnail_image: string | null }[],
  reads: [] as string[],
  order: null as null | [string, boolean],
  hang: false,
}));

vi.mock('@/integrations/supabase/client', () => {
  const chainFor = (table: string): any => {
    const payload = () => (table === 'golf_courses' ? { data: db.clubRows, error: null } : { data: [], error: null });
    const self: any = new Proxy(function () {} as unknown as object, {
      get: (_t, prop) => {
        // db.hang leaves the read in flight forever, so isLoading stays true.
        if (prop === 'then') return (fn: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => (db.hang ? new Promise(() => {}) : Promise.resolve(payload()).then(fn, rej));
        if (prop === 'catch') return (fn: (e: unknown) => unknown) => (db.hang ? new Promise(() => {}) : Promise.resolve(payload()).catch(fn));
        if (prop === 'order') {
          return (col: string, cfg?: { ascending?: boolean }) => {
            if (table === 'golf_courses') db.order = [col, cfg?.ascending !== false];
            return self;
          };
        }
        return self;
      },
      apply: () => self,
    });
    return self;
  };
  const supabase: any = new Proxy(function () {} as unknown as object, {
    get: (_t, prop) => {
      if (prop === 'from') return (table: string) => { db.reads.push(table); return chainFor(table); };
      return supabase;
    },
    apply: () => supabase,
  });
  return { supabase };
});

const state = vi.hoisted(() => ({
  homeClub: null as { id: string; name: string; isPrimary: boolean } | null,
  topTen: [] as { position: number; thumbnail_image?: string | null }[],
}));

vi.mock('@/lib/whs/useDeclineHandicapChip', () => ({ useDeclineHandicapChip: () => vi.fn() }));
vi.mock('@/lib/whs/hooks', () => ({
  useWhsConnection: () => ({ data: null, isFetched: true, isError: false }),
  useHandicapTrend: () => ({ data: null, isFetched: true, isError: false }),
  useHandicapHistory: () => ({ data: null, isFetched: true, isError: false }),
}));
vi.mock('@/hooks/useHandicapTrend12mo', () => ({ useHandicapTrend12mo: () => ({ delta: null, direction: 'flat' }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ linked: false, connected: false, settled: true, connection: null, trend: null, anyError: false }) }));
vi.mock('@/lib/whs/usePercentile', () => ({ useHandicapPercentile: () => ({ data: null }) }));
vi.mock('@/components/profile/rounds/useProfileRounds', () => ({
  useProfileRounds: () => ({ isSuccess: true, data: [] }),
  useHandicapIndex: () => null,
  isFullEighteen: () => true,
}));
vi.mock('@/hooks/gam/useProfileAchievementFigures', () => ({ useProfileAchievementFigures: () => ({ isFetched: true, data: null }) }));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({
  useProfileClubs: () => ({ homeClub: state.homeClub, secondaryClubs: [], isPrivate: false, isLoading: false }),
}));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: state.topTen, isLoading: false }) }));
vi.mock('@/features/amateur-ranking/useAmateurRanking', () => ({
  useAmateurSummary: () => ({ data: null, isSuccess: true }),
  useAmateurHistory: () => ({ data: [], isSuccess: true }),
  useAmateurEvents: () => ({ data: [], isSuccess: true }),
  useAmateurCareer: () => ({ data: [], isSuccess: true }),
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: vi.fn() }));

import { HeroShell } from '@/components/profile/hero/HeroShell';
import { HeroShell as OverviewHeroShell } from '@/features/tourhub/components/overview-v3/overviewShells';
import { ProfileHero } from '@/components/profile/hero/ProfileHero';
import { ProfileCoverBand } from '@/components/profile/hero/ProfileCoverBand';
import { FallbackCover, FALLBACK_COVER_GRADIENT } from '@/components/profile/hero/FallbackCover';
import { ClubProfileHero } from '@/components/business/hero/ClubProfileHero';
import { useClubCoverPhoto } from '@/components/profile/hooks/useClubCoverPhoto';
import { arrivalAction } from '@/features/edit-profile/completionRules';

const src = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');
// A real UUID: ProfileHero only passes UUID home-club ids to the club photo
// read, so the club-photo cases below need one to keep exercising that path.
const HOME = { id: '6f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d', name: 'Sundridge Park Golf Club', isPrimary: true };
const clubReads = () => db.reads.filter((t) => t === 'golf_courses');

const renderHero = (over: Record<string, unknown> = {}) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ProfileHero
          userId="u1"
          viewerUserId="u1"
          displayName="Alex Doe"
          isSelf
          indexValue={null}
          onStatTap={() => {}}
          onConnect={() => {}}
          {...over}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const hookProbe = (clubId: string | null) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result: { current?: { coverPhoto: string | null; isLoading: boolean } } = {};
  function Probe() {
    result.current = useClubCoverPhoto(clubId);
    return null;
  }
  const view = render(
    <QueryClientProvider client={qc}>
      <Probe />
    </QueryClientProvider>,
  );
  return { result, view };
};

beforeEach(() => {
  state.homeClub = null;
  state.topTen = [];
  db.clubRows = [];
  db.reads = [];
  db.order = null;
  db.hang = false;
});

afterEach(cleanup);

describe('BRIEF_PROFILE_COVER_FALLBACK — the cover chain', () => {
  it('an own cover photo wins over the club and Top 10 images', async () => {
    state.homeClub = HOME;
    db.clubRows = [{ thumbnail_image: 'club.jpg' }];
    state.topTen = [{ position: 1, thumbnail_image: 'top10.jpg' }];
    const { container } = renderHero({ coverUrl: 'own.jpg' });
    expect(container.querySelector('[data-cover-img]')?.getAttribute('src')).toBe('own.jpg');
    expect(container.querySelector('[data-fallback-cover]')).toBeNull();
    await new Promise((r) => setTimeout(r, 20));
    expect(clubReads()).toHaveLength(0);
  });

  it('with no cover of their own the home club course photo is used', async () => {
    state.homeClub = HOME;
    db.clubRows = [{ thumbnail_image: null }, { thumbnail_image: 'club.jpg' }];
    state.topTen = [{ position: 1, thumbnail_image: 'top10.jpg' }];
    const { container } = renderHero({ coverUrl: null });
    await waitFor(() => expect(container.querySelector('[data-cover-img]')?.getAttribute('src')).toBe('club.jpg'));
    expect(db.order).toEqual(['created_at', true]);
  });

  it('with no club photo the #1 Top 10 course image is used', async () => {
    state.homeClub = HOME;
    db.clubRows = [{ thumbnail_image: null }, { thumbnail_image: '   ' }];
    state.topTen = [{ position: 2, thumbnail_image: 'second.jpg' }, { position: 1, thumbnail_image: 'top10.jpg' }];
    const { container } = renderHero({ coverUrl: null });
    await waitFor(() => expect(clubReads().length).toBeGreaterThan(0));
    // The Top 10 photo appears only once the club read has resolved null.
    await waitFor(() => expect(container.querySelector('[data-cover-img]')?.getAttribute('src')).toBe('top10.jpg'));
  });

  it('with nothing to show the contours appear instead of a flat canvas', () => {
    const { container } = renderHero({ coverUrl: null });
    expect(container.querySelector('[data-cover-img]')).toBeNull();
    expect(container.querySelector('[data-fallback-cover]')).not.toBeNull();
    expect(container.querySelector('[data-photo-band-fade]')).not.toBeNull();
  });

  it('a hidden home club never supplies a photo because useProfileClubs withholds it', async () => {
    state.homeClub = null;
    db.clubRows = [{ thumbnail_image: 'club.jpg' }];
    const { container } = renderHero({ coverUrl: null, isSelf: false, viewerUserId: 'u2' });
    await new Promise((r) => setTimeout(r, 20));
    expect(clubReads()).toHaveLength(0);
    expect(container.querySelector('[data-cover-img]')).toBeNull();
    expect(container.querySelector('[data-fallback-cover]')).not.toBeNull();
  });

  it("a legacy 'text-fallback' home club never reaches the club photo read and falls through to the Top 10 photo", async () => {
    state.homeClub = { id: 'text-fallback', name: 'Sundridge Park Golf Club', isPrimary: true };
    db.clubRows = [{ thumbnail_image: 'club.jpg' }];
    state.topTen = [{ position: 1, thumbnail_image: 'top10.jpg' }];
    const { container } = renderHero({ coverUrl: null });
    await new Promise((r) => setTimeout(r, 20));
    expect(clubReads()).toHaveLength(0);
    expect(container.querySelector('[data-cover-img]')?.getAttribute('src')).toBe('top10.jpg');
  });

  it('while the club photo read is in flight the Top 10 photo is not shown', async () => {
    state.homeClub = { id: '6f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d', name: 'Sundridge Park Golf Club', isPrimary: true };
    db.hang = true;
    state.topTen = [{ position: 1, thumbnail_image: 'top10.jpg' }];
    const { container } = renderHero({ coverUrl: null });
    await new Promise((r) => setTimeout(r, 20));
    expect(clubReads().length).toBeGreaterThan(0);
    expect(container.querySelector('[data-cover-img]')).toBeNull();
    expect(container.querySelector('[data-fallback-cover]')).not.toBeNull();
  });

  it('a club photo read returning null still shows the Top 10 photo', async () => {
    state.homeClub = { id: '6f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d', name: 'Sundridge Park Golf Club', isPrimary: true };
    db.clubRows = [];
    state.topTen = [{ position: 1, thumbnail_image: 'top10.jpg' }];
    const { container } = renderHero({ coverUrl: null });
    await waitFor(() => expect(clubReads().length).toBeGreaterThan(0));
    await waitFor(() => expect(container.querySelector('[data-cover-img]')?.getAttribute('src')).toBe('top10.jpg'));
  });
});

describe('BRIEF_PROFILE_COVER_FALLBACK — the club course photo rule', () => {
  it('takes the first non-empty thumbnail in created_at ascending order', async () => {
    db.clubRows = [{ thumbnail_image: null }, { thumbnail_image: '   ' }, { thumbnail_image: 'first.jpg' }, { thumbnail_image: 'second.jpg' }];
    const { result } = hookProbe('club-1');
    await waitFor(() => expect(result.current?.isLoading).toBe(false));
    expect(db.order).toEqual(['created_at', true]);
    expect(result.current?.coverPhoto).toBe('first.jpg');
  });

  it('reads nothing at all without a club id', () => {
    const { result } = hookProbe(null);
    expect(result.current?.coverPhoto).toBeNull();
    expect(result.current?.isLoading).toBe(false);
    expect(clubReads()).toHaveLength(0);
  });
});

describe('BRIEF_PROFILE_COVER_FALLBACK — the band', () => {
  const band = (over: Record<string, unknown> = {}) =>
    render(<ProfileCoverBand coverUrl={null} avatar={<span>A</span>} displayName="Alex Doe" subline={null} {...over} />);

  it('a cover that fails to load falls back to the contours, with the fade still on top', () => {
    const { container } = band({ coverUrl: 'broken.jpg' });
    const img = container.querySelector('[data-cover-img]');
    expect(img).not.toBeNull();
    expect(container.querySelector('[data-fallback-cover]')).toBeNull();
    fireEvent.error(img!);
    expect(container.querySelector('[data-cover-img]')).toBeNull();
    expect(container.querySelector('[data-fallback-cover]')).not.toBeNull();
    expect(container.querySelector('[data-photo-band-fade]')).not.toBeNull();
  });

  it('a working cover keeps the photograph and shows no contours', () => {
    const { container } = band({ coverUrl: 'own.jpg' });
    expect(container.querySelector('[data-cover-img]')).not.toBeNull();
    expect(container.querySelector('[data-fallback-cover]')).toBeNull();
    expect(container.querySelector('[data-photo-band-fade]')).not.toBeNull();
  });

  it('the Add a cover pill sits 8px above the identity block and calls back', () => {
    const onAddCover = vi.fn();
    const { container } = band({ onAddCover, addCoverLabel: '+ Add a cover' });
    const pill = screen.getByRole('button', { name: '+ Add a cover' }) as HTMLElement;
    expect(pill.style.position).toBe('absolute');
    expect(pill.style.right).toBe('0px');
    expect(pill.style.bottom).toBe('calc(100% + 8px)');
    expect(pill.style.height).toBe('28px');
    expect(pill.style.borderRadius).toBe('999px');
    expect(pill.style.fontSize).toBe('9.5px');
    expect(pill.style.fontWeight).toBe('800');
    expect(pill.style.letterSpacing).toBe('0.14em');
    expect(pill.style.textTransform).toBe('uppercase');
    expect(pill.style.color).toBe('rgb(255, 255, 255)');
    expect((pill.parentElement as HTMLElement).style.position).toBe('relative');
    fireEvent.click(pill);
    expect(onAddCover).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-fallback-cover]')).not.toBeNull();
  });

  it('no pill without a callback', () => {
    const { container } = band();
    expect(screen.queryByRole('button', { name: '+ Add a cover' })).toBeNull();
    expect(container.querySelector('[data-add-cover]')).toBeNull();
  });

  it('the hero shows the pill only on an own profile with no cover of its own', () => {
    const own = renderHero({ coverUrl: 'own.jpg' });
    expect(own.container.querySelector('[data-add-cover]')).toBeNull();
    own.unmount();

    const none = renderHero({ coverUrl: null });
    expect(none.container.querySelector('[data-add-cover]')).not.toBeNull();
    none.unmount();

    const visitor = renderHero({ coverUrl: null, isSelf: false, viewerUserId: 'u2' });
    expect(visitor.container.querySelector('[data-add-cover]')).toBeNull();
    visitor.unmount();
  });

  it('the pill routes to the existing cover picker through src=cover', () => {
    const hero = src('components/profile/hero/ProfileHero.tsx');
    expect(hero).toContain("navigate('/edit-profile?src=cover')");
    expect(arrivalAction('cover')).toBe('cover');
    expect(arrivalAction('nudge_club')).toBe('homeClub');
    expect(arrivalAction('nudge_username')).toBe('username');
    expect(arrivalAction(null)).toBeNull();
    expect(src('pages/EditProfile.tsx')).toContain("if (action === 'cover') photos.current?.open('cover')");
    expect(src('../src/locales/en/profile.json')).toContain('"addCover": "+ Add a cover"');
  });
});

describe('BRIEF_PROFILE_COVER_FALLBACK — the business hero', () => {
  const hero = (coverUrl: string | null) =>
    render(
      <ClubProfileHero
        name="Sundridge Park Golf Club"
        placeLine="Golf club · Kent"
        coverUrl={coverUrl}
        onShare={() => {}}
        renderMore={(t) => t}
        team={null}
        isFollowing={false}
        onFollowToggle={() => {}}
        onBookTeeTime={() => {}}
        onMessage={() => {}}
      />,
    );

  it('with no course image it falls back to contours plus the shared fade', () => {
    const { container } = hero(null);
    expect(container.querySelector('[data-fallback-cover]')).not.toBeNull();
    expect(container.querySelector('[data-photo-band-fade]')).not.toBeNull();
    expect(container.querySelector('[data-club-cover] > img')).toBeNull();
    expect(screen.queryByRole('button', { name: '+ Add a cover' })).toBeNull();
  });

  it('with a course image it keeps the photograph and shows no contours', () => {
    const { container } = hero('course.jpg');
    expect(container.querySelector('[data-club-cover] > img')?.getAttribute('src')).toBe('course.jpg');
    expect(container.querySelector('[data-fallback-cover]')).toBeNull();
    expect(container.querySelector('[data-photo-band-fade]')).not.toBeNull();
  });
});

describe('BRIEF_PROFILE_COVER_FALLBACK — the contour artwork', () => {
  it('draws no SVG or patterned artwork', () => {
    const { container } = render(<FallbackCover />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('polyline')).toBeNull();
  });

  it('sits on the fairway green gradient as an inset-0 layer', () => {
    const { container } = render(<FallbackCover />);
    const layer = container.querySelector('[data-fallback-cover]') as HTMLElement;
    expect(layer.style.position).toBe('absolute');
    // jsdom serialises `inset: 0` bare; a browser reports 0px.
    expect(['0', '0px']).toContain(layer.style.inset);
    expect(FALLBACK_COVER_GRADIENT).toBe('var(--profile-fallback-cover-gradient)');
    expect(src('styles/style-tokens.css')).toContain('--profile-fallback-cover-gradient: linear-gradient(180deg, #1C2A22 0%, #131B16 58%, #0A0A0C 100%)');
  });
});


describe('Tour-pro HeroShell fallback opt-in', () => {
  const shell = (over: Record<string, unknown> = {}) => render(<HeroShell avatar={<span>A</span>} displayName="Pro" counters={[]} {...over} />);
  it('shows fallback artwork and fade without a cover when opted in', () => {
    const { container } = shell({ fallbackCover: true });
    expect(container.querySelector('[data-fallback-cover]')).not.toBeNull();
    expect(container.querySelector('[data-photo-band-fade]')).not.toBeNull();
  });
  it('shows fallback artwork after an opted-in cover fails', () => {
    const { container } = shell({ fallbackCover: true, coverUrl: 'broken.jpg' });
    const img = container.querySelector('img');
    if (!img) throw new Error('Expected cover image');
    fireEvent.error(img);
    expect(container.querySelector('[data-fallback-cover]')).not.toBeNull();
    expect(container.querySelector('[data-photo-band-fade]')).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });
  it('preserves the no-cover shell without the opt-in', () => {
    const { container } = shell();
    expect(container.querySelector('[data-fallback-cover]')).toBeNull();
  });
  it('preserves the Tour overview skeleton without fallback artwork', () => {
    const { container } = render(<OverviewHeroShell />);
    expect(container.querySelector('[data-overview-skeleton-hero]')).not.toBeNull();
    expect(container.querySelector('[data-fallback-cover]')).toBeNull();
  });
});
