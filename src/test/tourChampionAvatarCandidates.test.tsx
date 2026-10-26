import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ChampionStrip } from '@/features/tourhub/components/overview-v3/HybridHeroBands/ChampionStrip';
import { HybridHero } from '@/features/tourhub/components/overview-v3/HybridHero';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
import { MemoryRouter } from 'react-router-dom';

const fixture = vi.hoisted(() => ({ championProps: null as null | { avatarCandidates?: string[]; playerKey?: string | null } }));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/tourhub/hooks/useTourHubData', () => ({ useTourLeaderboard: () => ({ data: [{ id: 'winner-row', position: 1, score: -17, player: { sr_id: 'winner-key', full_name: 'Eugenio Lopez-Chacarra' } }] }) }));
vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', async importOriginal => ({ ...(await importOriginal<typeof import('@/features/tourhub/hooks/useLiveTournaments')>()), useLiveTournaments: () => ({ data: [], isLoading: false, isError: false }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand', () => ({ PhotoBand: () => null }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/ChampionStrip', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/tourhub/components/overview-v3/HybridHeroBands/ChampionStrip')>();
  return { ...actual, ChampionStrip: (props: Parameters<typeof actual.ChampionStrip>[0]) => {
    fixture.championProps = props;
    return <actual.ChampionStrip {...props} />;
  } };
});

afterEach(() => { cleanup(); fixture.championProps = null; });

describe('Tour champion avatar candidates', () => {
  it('walks from a missing first photo to the next candidate', () => {
    const { getByRole } = render(<ChampionStrip name="Eugenio Lopez-Chacarra" score="−17" avatarCandidates={['https://avatar.test/miss-a.png', 'https://avatar.test/good-b.png']} />);
    const img = getByRole('img', { name: 'Eugenio Lopez-Chacarra' });
    expect(img.getAttribute('src')).toBe('https://avatar.test/miss-a.png');
    fireEvent.error(img);
    expect(getByRole('img', { name: 'Eugenio Lopez-Chacarra' }).getAttribute('src')).toBe('https://avatar.test/good-b.png');
  });

  it('uses the player initials rather than the person icon when all photos miss', () => {
    const { getByRole, queryByRole, container } = render(<ChampionStrip name="Eugenio Lopez-Chacarra" score="−17" playerKey="winner-key" avatarCandidates={['https://avatar.test/miss-a.png', 'https://avatar.test/miss-b.png']} />);
    fireEvent.error(getByRole('img', { name: 'Eugenio Lopez-Chacarra' }));
    fireEvent.error(getByRole('img', { name: 'Eugenio Lopez-Chacarra' }));
    expect(queryByRole('img', { name: 'Eugenio Lopez-Chacarra' })).toBeNull();
    const fallback = container.querySelector('[data-avatar-fallback]');
    expect(fallback?.textContent).toBe('EL');
    expect(fallback?.querySelector('svg')).toBeNull();
  });

  it('passes the full tour-folder walk and upload override from HybridHero', () => {
    const slide: HeroSlide = { type: 'completed', tournament: {
      id: 'india', name: 'India Championship', status: 'closed', startDate: '2026-10-15', endDate: '2026-10-18',
      venueName: null, venueCourseName: null, venueCity: null, venueState: null, venueCountry: null, venuePar: 72, venueYardage: null,
      purse: null, winningShare: null, currency: null, tourSlug: 'euro', tourName: 'DP World Tour',
      defendingChampion: null, defendingChampionPhotoUrl: null, defendingChampionPgaTourId: null,
      isMajor: false, isSignature: false, eventType: 'stroke', winnerId: 'winner-key', winnerKey: 'winner-key',
      winnerName: 'Eugenio Lopez-Chacarra', winnerPhotoUrl: null, winnerHeadshotOverride: 'Eugenio renamed',
      winnerPgaTourId: null, winnerScore: '-17', leaderScore: -17, leaderName: 'Eugenio Lopez-Chacarra', currentRound: 4, currentRoundStatus: null,
    } };
    render(<MemoryRouter><HybridHero slide={slide} state={{ kind: 'results', variant: 'standard', finishDate: '2026-10-18', meta: '' }} now={new Date('2026-10-19')} activeTournamentId={null} onSelectTour={() => {}} onOpenTournament={() => {}} /></MemoryRouter>);
    const candidates = fixture.championProps?.avatarCandidates ?? [];
    expect(candidates.length).toBeGreaterThan(1);
    expect(candidates.some(url => url.includes('/DP%20World%20Tour/Eugenio%20renamed.webp'))).toBe(true);
    expect(candidates.every(url => decodeURIComponent(url).includes('Eugenio renamed') || decodeURIComponent(url).includes('Eugenio_renamed'))).toBe(true);
    expect(fixture.championProps?.playerKey).toBe('winner-key');
  });
});