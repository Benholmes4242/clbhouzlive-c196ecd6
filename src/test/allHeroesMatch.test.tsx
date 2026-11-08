/**
 * ALL_HEROES_MATCH — every photo hero shares the tour overview hero's
 * material: the solid-foot PhotoBandFade, text 20px from the sides and 14px
 * from the bottom, the amber kicker and the 26px/800 title. The tournament
 * hero's mounted tour-line test lives in tournamentV3Sections.test.tsx (it
 * needs the real tourhub i18n); this file covers the shared fade, the review
 * wizard, the golfer band, the business hero and the pro shell.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { PhotoBandFade, photoBandFade } from '@/features/tourhub/components/overview-v3/HybridHeroBands/photoBandMaterial';
import { ProfileCoverBand } from '@/components/profile/hero/ProfileCoverBand';
import { ClubProfileHero } from '@/components/business/hero/ClubProfileHero';
import { HeroShell } from '@/components/profile/hero/HeroShell';
import { PHOTO_HEADER_H_CSS } from '@/features/review-v2/components/ReviewComposerHeader';
import { PERSONAL_COVER_ASPECT, PERSONAL_COVER_ASPECT_CSS, BUSINESS_COVER_ASPECT, BUSINESS_COVER_ASPECT_CSS } from '@/lib/tokens/coverAspect';
import { HERO_PHOTO_HEIGHT, EXPLORE_COURSE_HERO_HEIGHT } from '@/lib/heroHeights';
import { OVERVIEW_PHOTO_BAND_HEIGHT, PHOTO_BAND_HEIGHT } from '@/features/tourhub/components/overview-v3/HybridHero.constants';

const src = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');
const toRgb = (c: string) => { const d = document.createElement('div'); d.style.color = c; return d.style.color; };

afterEach(cleanup);

describe('ALL_HEROES_MATCH step 0 — the shared fade', () => {
  it('the token ends on a solid canvas foot', () => {
    const css = src('styles/tour-hub-tokens.css');
    expect(css).toContain('--th-overview-photo-fade: linear-gradient(180deg, rgba(10,10,12,0.15) 0%, rgba(10,10,12,0) 20%, rgba(10,10,12,0.62) 48%, rgba(10,10,12,0.97) 88%, rgba(10,10,12,1) 100%)');
  });
  it('a canvas prop builds the same five stops in that colour', () => {
    expect(photoBandFade('#16161A')).toBe('linear-gradient(180deg, rgba(22,22,26,0.15) 0%, rgba(22,22,26,0) 20%, rgba(22,22,26,0.62) 48%, rgba(22,22,26,0.97) 88%, rgba(22,22,26,1) 100%)');
  });
  it('no prop uses the token; a non-hex canvas falls back to it', () => {
    // jsdom drops var() backgrounds, so the token path is proven in source.
    const material = src('features/tourhub/components/overview-v3/HybridHeroBands/photoBandMaterial.tsx');
    expect(material).toContain("if (!m) return 'var(--th-overview-photo-fade)'");
    expect(material).toContain("canvas ? photoBandFade(canvas) : 'var(--th-overview-photo-fade)'");
    expect(photoBandFade('red')).toBe('var(--th-overview-photo-fade)');
    const { container } = render(<PhotoBandFade />);
    expect(container.querySelector('[data-photo-band-fade]')).not.toBeNull();
  });
});

describe('ALL_HEROES_MATCH review wizard step 1', () => {
  it('the photo header is 350px in total, notch counted inside', () => {
    expect(PHOTO_HEADER_H_CSS).toBe('350px');
    expect(src('features/review-v2/components/reviewComposerHeader.css')).toContain('.rv2-header--photo { height: 350px; }');
  });
  it('the fade ends on the wizard canvas and the masthead is the photo band', () => {
    const hero = src('features/review-v2/components/ReviewCourseHero.tsx');
    expect(hero).toContain('<PhotoBandFade canvas={RV2.canvas} />');
    expect(hero).toContain('photoBand');
    // photoBand drops the hairline rule above the reference line.
    const masthead = src('components/courses/CourseMasthead.tsx');
    expect(masthead).toContain("photoBand ? <div style={{ marginTop: 9 }}>{children}</div> : <MastheadRule>{children}</MastheadRule>");
  });
});

describe('ALL_HEROES_MATCH golfer profile band', () => {
  it('is a 350px band whose crop frame keeps the 39/34 constant', () => {
    expect(PERSONAL_COVER_ASPECT).toBe(39 / 34);
    expect(PERSONAL_COVER_ASPECT_CSS).toBe('39 / 34');
    const { container } = render(<ProfileCoverBand coverUrl="x.jpg" avatar={<span>A</span>} displayName="Benjamin Holmes" subline="Sundridge Park Golf Club" action={<button type="button">Edit</button>} />);
    expect((container.firstElementChild as HTMLElement).style.height).toBe('350px');
    expect(container.querySelector('[data-photo-band-fade]')).not.toBeNull();
  });
  it('puts the club in the kicker row with the controls, name at 26px with no shadow', () => {
    render(<ProfileCoverBand coverUrl={null} avatar={<span>A</span>} displayName="Benjamin Holmes" subline="Sundridge Park Golf Club" action={<button type="button">Edit</button>} />);
    const kicker = screen.getByText('Sundridge Park Golf Club');
    const kickerRow = kicker.parentElement as HTMLElement;
    expect(kickerRow.style.display).toBe('flex');
    expect(kickerRow.style.justifyContent).toBe('space-between');
    expect(kickerRow.textContent).toContain('Edit');
    const name = screen.getByRole('heading', { level: 1 });
    expect(name.style.fontSize).toBe('26px');
    expect(name.style.textShadow).toBe('');
    // The old club line under the name is gone: the kicker IS the club.
    expect(name.parentElement!.textContent).not.toContain('Sundridge Park');
  });
});

describe('ALL_HEROES_MATCH business profile hero', () => {
  const hero = (over: Partial<React.ComponentProps<typeof ClubProfileHero>> = {}) =>
    render(
      <ClubProfileHero
        name="Sundridge Park Golf Club"
        placeLine="Golf club · Kent · 2 courses"
        coverUrl="cover.jpg"
        onShare={() => {}}
        renderMore={(trigger) => trigger}
        team={null}
        isFollowing={false}
        onFollowToggle={() => {}}
        onBookTeeTime={() => {}}
        onMessage={() => {}}
        {...over}
      />,
    );
  it('lays the fade over a 350px cover with the identity on the photo', () => {
    const { container } = hero();
    const cover = container.querySelector('[data-club-cover]') as HTMLElement;
    expect(cover.style.height).toBe('350px');
    expect(cover.querySelector('[data-photo-band-fade]')).not.toBeNull();
    // Place is the amber kicker with Share/More on its right.
    const place = cover.querySelector('[data-club-place]') as HTMLElement;
    expect(place.style.fontSize).toBe('11px');
    expect(place.style.textTransform).toBe('uppercase');
    const kickerRow = place.parentElement as HTMLElement;
    expect(kickerRow.querySelectorAll('button')).toHaveLength(2);
    // Crest and name sit on the photo.
    expect(cover.querySelector('[data-club-crest]')).not.toBeNull();
    const name = cover.querySelector('h1') as HTMLElement;
    expect(name.style.fontSize).toBe('26px');
    expect(name.style.letterSpacing).toBe('0');
  });
  it('the pills follow directly below the cover; the -74px overlap is gone', () => {
    const { container } = hero();
    const cover = container.querySelector('[data-club-cover]') as HTMLElement;
    const actions = container.querySelector('[data-club-actions]') as HTMLElement;
    expect(cover.parentElement).toBe(actions.parentElement?.parentElement);
    expect(actions.style.padding).toBe('14px 20px 0px');
    expect(src('components/business/hero/ClubProfileHero.tsx')).not.toContain('marginTop: -74');
  });
});

describe('ALL_HEROES_MATCH pro profile shell', () => {
  it('replaces the wash, ramp and top guard with the shared fade', () => {
    const shell = src('components/profile/hero/HeroShell.tsx');
    expect(shell).toContain('<PhotoBandFade />');
    expect(shell).not.toContain('COVER_WASH');
    expect(shell).not.toContain('COVER_RAMP');
    expect(shell).not.toContain('COVER_TOP_GUARD');
    const { container } = render(<HeroShell coverUrl="x.jpg" avatar={<span>A</span>} displayName="Mason Essam" counters={[]} kicker={<div className="pro-hero-kicker">Alps Tour · Dartford Golf Club</div>} />);
    const section = container.querySelector('section') as HTMLElement;
    expect(section.style.padding).toBe('0px 20px 14px');
    expect(section.querySelector('[data-photo-band-fade]')).not.toBeNull();
    expect(section.textContent).toContain('Alps Tour · Dartford Golf Club');
  });
  it('the pro name is 26px at normal spacing and the club line is gone', () => {
    const css = src('features/pro-profile/pro-profile.css');
    expect(css).toContain('.pro-hero-name { margin:0; font-size:26px; font-weight:800; line-height:1.1; letter-spacing:0;');
    expect(css).not.toContain('.pro-hero-club');
    expect(css).not.toContain('max-width:359px) { .pro-hero-name');
    expect(css).toContain('.pro-hero-profession { font-size:12.5px; font-weight:600;');
    expect(css).toContain('color:rgba(255,255,255,.78)');
  });
});

describe('HERO_350 — every photo hero is 350px with the notch counted inside', () => {
  it('the shared constant is 350 and the business crop frame is 39/34', () => {
    expect(HERO_PHOTO_HEIGHT).toBe(350);
    expect(EXPLORE_COURSE_HERO_HEIGHT).toBe(HERO_PHOTO_HEIGHT);
    expect(BUSINESS_COVER_ASPECT).toBe(39 / 34);
    expect(BUSINESS_COVER_ASPECT_CSS).toBe('39 / 34');
  });
  it('the overview band is 350 with no safe-area term; the news hero stays 340', () => {
    expect(OVERVIEW_PHOTO_BAND_HEIGHT).toBe(HERO_PHOTO_HEIGHT);
    expect(PHOTO_BAND_HEIGHT).toBe(340);
    const constants = src('features/tourhub/components/overview-v3/HybridHero.constants.ts');
    expect(constants).toContain('OVERVIEW_PHOTO_BAND_HEIGHT = HERO_PHOTO_HEIGHT');
    const photoBand = src('features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx');
    expect(photoBand).toContain('height: photoBandHeight(heightPx)');
  });
  it('the Courses page, amateur and course-detail heroes all read the 350 constant', () => {
    expect(src('components/courses/CoursesPageHero.tsx')).toContain('height: EXPLORE_COURSE_HERO_HEIGHT');
    expect(src('features/amateur/AmateurHero.tsx')).toContain('AMATEUR_HERO_H = EXPLORE_COURSE_HERO_HEIGHT');
    const detail = src('components/golf-club/GolfClubView.tsx');
    expect(detail).toContain('const heroHeight = EXPLORE_COURSE_HERO_HEIGHT;');
    expect(detail).toContain('height: heroHeight');
  });
  it('the tournament hero is 350 with no safe-area term', () => {
    const sections = src('features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx');
    expect(sections).toContain('style={{height:HERO_PHOTO_HEIGHT}}');
    expect(sections).not.toContain('photoBandHeight(340,true)');
    expect(sections).not.toContain('photoBandHeight(HERO_PHOTO_HEIGHT,true)');
  });
  it('the review photo header is 350 with no safe-area term', () => {
    expect(PHOTO_HEADER_H_CSS).toBe('350px');
    expect(src('features/review-v2/components/reviewComposerHeader.css')).toContain('.rv2-header--photo { height: 350px; }');
  });
  it('the golfer cover band is 350 with no safe-area term', () => {
    const band = src('components/profile/hero/ProfileCoverBand.tsx');
    expect(band).toContain('height: HERO_PHOTO_HEIGHT');
    expect(band).not.toContain('aspectRatio');
    const { container } = render(<ProfileCoverBand coverUrl="x.jpg" avatar={<span>A</span>} displayName="Benjamin Holmes" subline={null} />);
    expect((container.firstElementChild as HTMLElement).style.height).toBe('350px');
  });
  it('the business cover is 350 with or without a photo', () => {
    const heroSrc = src('components/business/hero/ClubProfileHero.tsx');
    expect(heroSrc).toContain('height: HERO_PHOTO_HEIGHT');
    for (const coverUrl of ['cover.jpg', null]) {
      const { container, unmount } = render(
        <ClubProfileHero name="Sundridge Park Golf Club" placeLine={null} coverUrl={coverUrl} onShare={() => {}} renderMore={(t) => t} team={null} isFollowing={false} onFollowToggle={() => {}} onBookTeeTime={() => {}} onMessage={() => {}} />,
      );
      expect((container.querySelector('[data-club-cover]') as HTMLElement).style.height).toBe('350px');
      unmount();
    }
  });
  it('the pro hero carries a 350 minHeight floor with a cover, none without', () => {
    const shell = src('components/profile/hero/HeroShell.tsx');
    expect(shell).toContain('minHeight: coverUrl ? HERO_PHOTO_HEIGHT : undefined');
    expect(shell).not.toContain('BUSINESS_COVER_ASPECT_CSS');
    const withCover = render(<HeroShell coverUrl="x.jpg" avatar={<span>A</span>} displayName="Mason Essam" counters={[]} />);
    expect((withCover.container.querySelector('section') as HTMLElement).style.minHeight).toBe('350px');
    withCover.unmount();
    const noCover = render(<HeroShell coverUrl={null} avatar={<span>A</span>} displayName="Mason Essam" counters={[]} />);
    expect((noCover.container.querySelector('section') as HTMLElement).style.minHeight).toBe('');
  });
  it('the HeroShell skeleton matches the 350 floor', () => {
    expect(src('components/skeletons/ProfileSurfaceSkeleton.tsx')).toContain('minHeight: HERO_PHOTO_HEIGHT');
  });
});
