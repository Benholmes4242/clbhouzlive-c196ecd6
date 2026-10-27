/**
 * CB104 — the tour player hero band pins its text to the BOTTOM of the
 * 268px band. The section must be a flex column so the content wrapper's
 * flex: 1 actually resolves; a percentage min-height against a parent that
 * only has a min-height does not, which is what left the name against the
 * header. Styles are asserted, not layout pixels, because jsdom does not
 * lay out.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/tourhub/components/PlayerAvatar', () => ({ PlayerAvatar: () => <div data-avatar="" /> }));

import { HeroSection } from '@/features/tourhub/player-v2/sections/HeroSection';
import type { TourPlayer, TourPlayerStatistics } from '@/features/tourhub/hooks/useTourHubData';
import type { PlayerSeasonSelection } from '@/features/tourhub/player-v2/playerSeason';
import { TOUR_PLAYER_HERO_H } from '@/features/tourhub/_shared/tokens';

afterEach(() => { cleanup(); });

const player = {
  id: 'p1', full_name: 'Rory McIlroy', country: 'NIR', country_code: 'nir',
  college: null, college_normalized: null, photo_url: null, headshot_override: null,
  tour_codes: ['pga'],
} as unknown as TourPlayer;
const stats = { world_rank: 1, fedex_rank: 3 } as TourPlayerStatistics;
const selection = { verdict: null, headline: null, raceProof: null } as unknown as PlayerSeasonSelection;

describe('tour player hero band', () => {
  it('the section is a flex column that still carries the 268px floor', () => {
    const { container } = render(<HeroSection player={player} playerStats={stats} selection={selection} />);
    const section = container.querySelector('section')!;
    expect(section.style.display).toBe('flex');
    expect(section.style.flexDirection).toBe('column');
    expect(section.style.minHeight).toBe(TOUR_PLAYER_HERO_H);
    expect(section.style.overflow).toBe('hidden');
    expect(section.style.position).toBe('relative');
  });

  it('the content wrapper grows to fill the band and sits at its foot', () => {
    const { container } = render(<HeroSection player={player} playerStats={stats} selection={selection} />);
    const content = container.querySelector('h1')!.parentElement!;
    expect(content.style.flexGrow).toBe('1');
    expect(content.style.justifyContent).toBe('flex-end');
    /* The old percentage floor is gone: it never resolved against a parent
       that only had a min-height, which is what pinned the text to the top. */
    expect(content.style.minHeight).toBe('');
    expect(content.style.display).toBe('flex');
    expect(content.style.flexDirection).toBe('column');
  });

  it('the inset and the avatar door stay exactly as they were', () => {
    const { container } = render(<HeroSection player={player} playerStats={stats} selection={selection} />);
    const content = container.querySelector('h1')!.parentElement!;
    /* Asserted as longhands: the shorthand serialises with the right inset
       already folded in (24px 114px 16px 16px). */
    expect(content.style.paddingTop).toBe('24px');
    expect(content.style.paddingRight).toBe('114px');
    expect(content.style.paddingBottom).toBe('16px');
    expect(content.style.paddingLeft).toBe('16px');
    const avatarDoor = content.parentElement!.querySelector(':scope > div[style*="absolute"]') as HTMLElement;
    expect(avatarDoor.style.right).toBe('16px');
    expect(avatarDoor.style.top).toBe('50%');
  });

  it('the band still holds the name, the verdict gap and the rank row', () => {
    const { container } = render(<HeroSection player={player} playerStats={stats} selection={selection} />);
    const content = container.querySelector('h1')!.parentElement!;
    expect(container.querySelector('h1')!.textContent).toBe('Rory McIlroy');
    const rankRow = content.querySelector('div[style*="border-top"]') as HTMLElement;
    expect(rankRow).not.toBeNull();
    expect(rankRow.style.marginTop).toBe('16px');
    expect(rankRow.textContent).toContain('1');
    expect(rankRow.textContent).toContain('3');
  });
});
