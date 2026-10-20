/**
 * BRIEF_PROFILE_HERO_CLUB_WHITE — in the profile hero, the home club line under
 * the member's name reads the SAME colour as the name. The "Add your home club"
 * prompt that appears on your own profile with no club set is a prompt, not
 * information, so it stays W_55.
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

/** jsdom serialises colours through cssstyle; compare them the way the DOM does. */
const toRgb = (c: string) => { const d = document.createElement('div'); d.style.color = c; return d.style.color; };

const NAME = 'Kristian Andberg';

describe('BRIEF_PROFILE_HERO_CLUB_WHITE', () => {
  it('paints the home club subline the same colour as the name', () => {
    render(
      <ProfileCoverBand
        coverUrl={null}
        avatar={<span>KA</span>}
        displayName={NAME}
        subline="Kristianstad Golf Club"
      />,
    );

    const name = screen.getByRole('heading', { level: 1 });
    const subline = screen.getByText('Kristianstad Golf Club');

    expect(subline.style.color).toBe(toRgb('#FFFFFF'));
    expect(subline.style.color).toBe(name.style.color);
    expect(subline.style.color).not.toBe(toRgb(W_55));

    // Everything else on that line is frozen by the brief.
    expect(subline.style.fontSize).toBe('12.5px');
    expect(subline.style.fontWeight).toBe('600');
    expect(subline.style.marginTop).toBe('3px');
    expect(subline.style.textShadow).toBe('0 1px 8px rgba(0, 0, 0, 0.5)');
    expect(subline.style.overflow).toBe('hidden');
    expect(subline.style.textOverflow).toBe('ellipsis');
    expect(subline.style.whiteSpace).toBe('nowrap');
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
    expect(prompt.style.fontSize).toBe('12.5px');
    expect(prompt.style.fontWeight).toBe('600');
  });
});
