import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

/**
 * BRIEF_TOP_TEN_SHARE_CARD_V2 §TESTS — the one render test of TopTenShareCard
 * (story): ten courses draw hero + two tiles + seven rows; a 9.4 is A.INK
 * and an 8.6 is A.INK; the stat line drops HCP when showHandicap is false;
 * no "clbhouz.co.uk" and no "stay in play." anywhere on the card.
 *
 * react-i18next mock copied in full per the project canon: initReactI18next
 * is required at module load; t returns defaultValue or ''.
 */
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (_k: string, o?: { defaultValue?: string } | string) =>
      typeof o === 'string' ? o : o?.defaultValue ?? '',
  }),
}));

import { TopTenShareCard, type TopTenShareCourse } from '@/components/profile/hero/topTenShare/TopTenShareCard';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const courses: TopTenShareCourse[] = [
  { position: 1, name: 'Trump Turnberry Resort - Ailsa', region: 'Ayrshire', sub_country: 'Scotland', country: 'United Kingdom', thumbnail_image: null, rating: 9.6 },
  { position: 2, name: 'Royal Portrush Golf Club (Dunluce)', region: 'Co. Antrim', sub_country: 'Northern Ireland', country: 'United Kingdom', thumbnail_image: null, rating: 9.4 },
  { position: 3, name: 'Royal County Down Golf Club (Championship)', region: 'Co. Down', sub_country: 'Northern Ireland', country: 'United Kingdom', thumbnail_image: null, rating: 9.3 },
  { position: 4, name: 'Parkstone Golf Club', region: 'Dorset', sub_country: 'England', country: 'United Kingdom', thumbnail_image: null, rating: 8.9 },
  { position: 5, name: "Royal St George's Golf Club", region: 'Kent', sub_country: 'England', country: 'United Kingdom', thumbnail_image: null, rating: 8.6 },
  { position: 6, name: 'Portstewart Golf Club (Strand)', region: 'Co. Londonderry', sub_country: 'Northern Ireland', country: 'United Kingdom', thumbnail_image: null, rating: 8.6 },
  { position: 7, name: 'Monte Rei Golf and Country Club (North)', region: 'Algarve', sub_country: null, country: 'Portugal', thumbnail_image: null, rating: 8.5 },
  { position: 8, name: 'Royal Cinque Ports Golf Club', region: 'Kent', sub_country: 'England', country: 'United Kingdom', thumbnail_image: null, rating: 8.5 },
  { position: 9, name: "Golf d'Hardelot (Les Dunes)", region: 'Hauts-de-France', sub_country: null, country: 'France', thumbnail_image: null, rating: 8.4 },
  { position: 10, name: 'Royal County Down Golf Club (Annesley)', region: 'Co. Down', sub_country: 'Northern Ireland', country: 'United Kingdom', thumbnail_image: null, rating: 8.4 },
];

const identity = { displayName: 'Thomas Holmes', avatarUrl: null, handicapIndex: 5.5, rounds: 173, rated: 32 };

const renderCard = (showHandicap: boolean) =>
  render(
    <TopTenShareCard
      format="story"
      courses={courses}
      identity={identity}
      showHandicap={showHandicap}
      showHeroPhoto
      photos={[null, null, null]}
    />,
  );

describe('BRIEF_TOP_TEN_SHARE_CARD_V2 card render (story)', () => {
  it('ten courses render a hero, two tiles and seven rows', () => {
    const { container } = renderCard(true);
    expect(container.querySelectorAll('[data-share-hero]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-share-tile]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-share-row]')).toHaveLength(7);
    expect(container.querySelector('[data-share-hero]')?.textContent).toContain('Trump Turnberry');
    expect(container.querySelector('[data-share-row="10"]')?.textContent).toContain('Annesley');
  });

  it('a 9.4 rating and an 8.6 are both ink', () => {
    const { container } = renderCard(true);
    const green = Array.from(container.querySelectorAll('span, div')).find((el) => el.textContent === '9.4');
    const ink = Array.from(container.querySelectorAll('span, div')).find((el) => el.textContent === '8.6');
    expect(green).toBeTruthy();
    expect(ink).toBeTruthy();
    expect((green as HTMLElement).style.color).toBe('rgb(248, 250, 252)');
    expect((ink as HTMLElement).style.color).toBe('rgb(248, 250, 252)');
  });

  it('the stat line omits HCP when showHandicap is false and includes it when true', () => {
    const off = renderCard(false);
    expect(off.container.textContent).not.toContain('HCP');
    off.unmount();
    const on = renderCard(true);
    expect(on.container.textContent).toContain('HCP');
  });

  it('never prints clbhouz.co.uk or the retired tagline', () => {
    const { container } = renderCard(true);
    expect(container.textContent).not.toContain('clbhouz.co.uk');
    expect(container.textContent).not.toContain('stay in play.');
  });

  it('the hero place reads variant, then region and sub_country', () => {
    const { container } = renderCard(true);
    expect(container.querySelector('[data-share-hero]')?.textContent).toContain(
      'Ailsa · Ayrshire, Scotland',
    );
  });
});
