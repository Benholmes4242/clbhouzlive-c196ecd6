import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { HERO_CONTENT_TOP, HERO_CONTENT_BOTTOM, HERO_PHOTO_HEIGHT } from '@/lib/heroHeights';
import { OVERVIEW_KICKER_ROW_HEIGHT, OVERVIEW_KICKER_LINE_HEIGHT, OVERVIEW_LIVE_STACK, OVERVIEW_LEADER_NAME_LINE_HEIGHT, OVERVIEW_VENUE_LINE_HEIGHT } from '@/features/tourhub/components/overview-v3/HybridHeroBands/photoBandGeometry';
import { MASTHEAD_PLACE } from '@/components/courses/CourseMasthead';

const source = (path: string) => readFileSync(`src/${path}`, 'utf8');

describe('HERO_START_LINE ruling', () => {
  it('derives the reference and matches the measured live three-face text top within 0.5px', () => {
    expect(HERO_CONTENT_TOP).toBe(HERO_PHOTO_HEIGHT - HERO_CONTENT_BOTTOM - OVERVIEW_LIVE_STACK + (OVERVIEW_KICKER_ROW_HEIGHT - OVERVIEW_KICKER_LINE_HEIGHT) / 2);
    // Real-stylesheet Chromium measurements at320/390/430, not the stale184 guide.
    for (const measured of [193.9375, 193.9375, 193.9375]) {
      expect(Math.abs(HERO_CONTENT_TOP - measured)).toBeLessThanOrEqual(0.5);
    }
    expect(Math.abs(HERO_CONTENT_TOP - 193.9)).toBeLessThanOrEqual(0.5);
  });
  it('preserves the original leader name and place line boxes', () => {
    expect(OVERVIEW_LEADER_NAME_LINE_HEIGHT).toBe(1.1);
    expect(OVERVIEW_VENUE_LINE_HEIGHT).toBe(1.2);
    expect(MASTHEAD_PLACE.lineHeight).toBe(1.2);
    expect(Number(MASTHEAD_PLACE.fontSize) * Number(MASTHEAD_PLACE.lineHeight)).toBe(15);
  });
  it('keeps the review offset measured, with the first-paint fallback', () => {
    const text = source('features/review-v2/ReviewComposerV2.tsx');
    expect(text).toContain("style.setProperty('--review-header-height', `${header.getBoundingClientRect().height}px`)");
    expect(text).toContain('var(--review-header-height, ${HERO_PHOTO_HEIGHT}px)');
    expect(text).not.toContain('PHOTO_HEADER_H_CSS');
  });
  it('shares the reference across every converted hero and named skeleton', () => {
    for (const path of ['components/courses/CoursesPageHero.tsx', 'components/golf-club/GolfClubView.tsx', 'features/review-v2/components/ReviewCourseHero.tsx', 'components/profile/hero/ProfileCoverBand.tsx', 'components/business/hero/ClubProfileHero.tsx', 'components/profile/hero/HeroShell.tsx', 'features/amateur/AmateurHero.tsx', 'components/skeletons/CourseDetailSkeleton.tsx', 'components/skeletons/ProfileSurfaceSkeleton.tsx']) {
      expect(source(path)).toContain('paddingTop: HERO_CONTENT_TOP');
      expect(source(path)).not.toContain('height: HERO_PHOTO_HEIGHT');
    }
    expect(source('features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx')).toContain('paddingTop:HERO_CONTENT_TOP,paddingBottom:HERO_CONTENT_BOTTOM');
    expect(source('features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx')).toContain('minHeight: OVERVIEW_KICKER_ROW_HEIGHT');
  });
});