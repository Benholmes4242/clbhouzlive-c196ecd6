/**
 * BRIEF_PROFILE_HERO_CLUB_WHITE — superseded by ALL_HEROES_MATCH §3: the home
 * club is no longer a white subline under the name; it is the amber kicker
 * line on top of the band (MASTHEAD_KICKER), with the controls on its right.
 * The "Add your home club" prompt that appears on your own profile with no
 * club set is a prompt, not information, so it stays W_55.
 *
 * The band is a pure presentational block: it takes its photograph, avatar,
 * name, subline and controls as props, so the test renders it directly.
 * react-i18next is mocked because the band's HeroShell import reaches
 * @/i18n/format, which loads the i18n index at module load.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { ProfileCoverBand } from '@/components/profile/hero/ProfileCoverBand';
import { W_55 } from '@/components/profile/hero/HeroShell';
import { A } from '@/features/courses/components/holes/analytical/tokens';

/** jsdom serialises colours through cssstyle; compare them the way the DOM does. */
const toRgb = (c: string) => { const d = document.createElement('div'); d.style.color = c; return d.style.color; };

const NAME = 'Kristian Andberg';

describe('BRIEF_PROFILE_HERO_CLUB_WHITE', () => {
  it('paints the home club as the amber kicker above the name', () => {
    render(
      <ProfileCoverBand
        coverUrl={null}
        avatar={<span>KA</span>}
        displayName={NAME}
        subline="Kristianstad Golf Club"
      />,
    );

    const name = screen.getByRole('heading', { level: 1 });
    const kicker = screen.getByText('Kristianstad Golf Club');

    expect(kicker.style.color).toBe(toRgb(A.AMBER));
    expect(kicker.style.color).not.toBe(toRgb('#FFFFFF'));
    expect(kicker.style.color).not.toBe(toRgb(W_55));

    // The kicker shares the tour hero's kicker rule.
    expect(kicker.style.fontSize).toBe('11px');
    expect(kicker.style.fontWeight).toBe('700');
    expect(kicker.style.letterSpacing).toBe('0.15em');
    expect(kicker.style.textTransform).toBe('uppercase');
    expect(kicker.style.overflow).toBe('hidden');
    expect(kicker.style.textOverflow).toBe('ellipsis');
    expect(kicker.style.whiteSpace).toBe('nowrap');

    // The name is the shared 26px hero title with no text shadow.
    expect(name.style.fontSize).toBe('26px');
    expect(name.style.fontWeight).toBe('800');
    expect(name.style.letterSpacing).toBe('0px');
    expect(name.style.lineHeight).toBe('1.1');
    expect(name.style.textShadow).toBe('');
  });

  it('keeps the add-home-club prompt at W_55', () => {
    render(
      <ProfileCoverBand
        coverUrl={null}
        avatar={<span>KA</span>}
        displayName={NAME}
        subline={null}
        onAddHomeClub={() => {}}
        addHomeClubLabel="Add your home club"
      />,
    );

    const prompt = screen.getByRole('button', { name: 'Add your home club' });

    expect(prompt.style.color).toBe(toRgb(W_55));
    expect(prompt.style.color).not.toBe(toRgb('#FFFFFF'));
    expect(prompt.style.color).not.toBe(toRgb(A.AMBER));
  });
});
