import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreHero } from '@/components/explore-tab-new/hooks/useExploreHero';
import { useExploreMood, type ExploreMoodId } from '@/components/explore-tab-new/hooks/useExploreMood';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatRatingValue } from '@/utils/formatters';
import {
  buildOverviewHeroBackground,
  COURSE_GRADIENT,
} from '@/features/tourhub/components/overview-v3/HybridHero.constants';

/**
 * CoursesPageHero
 * ---------------
 * Shared cinematic hero rendered above the Discover / Courses / Top 100
 * tabs on /courses. Uses the SAME mechanics as GolfClubView's cinematic
 * hero (notch bleed, scrim, cover position) and the SAME data source as
 * the old Discover "Standout courses" card (useExploreHero).
 *
 * Scrim treatment: shares the layered stack from the Tour Overview
 * `PhotoBand` (top scrim + heavy bottom scrim + radial ambient) via
 * `buildOverviewHeroBackground` so the Courses hero matches the Tour
 * Overview hero pixel-for-pixel.
 *
 * The global CompactHeader floats over this hero in transparent overlay
 * mode; this component reserves that space via env(safe-area-inset-top).
 *
 * Copy surfaces: `why_ai` (course_mood_blurbs) and `context_stats` were
 * already returned by get_explore_hero and simply thrown away. Both are
 * rendered here; neither is fetched here. No RPC was added or changed.
 *
 * Analytics callsites:
 *  - hero_blurb_shown   { course_id, mood }                (blurb effect)
 *  - hero_context_shown { course_id, mood, kind }          (context effect)
 *  - hero_view_course   { course_id, mood, had_blurb }     (CTA onClick)
 */

const HERO_MIN_HEIGHT =
  'calc(clamp(380px, 44dvh, 460px) + env(safe-area-inset-top, 0px))';

type ContextKind = 'similar' | 'friends' | 'bucket' | 'hidden';

interface HeroContextLine {
  kind: ContextKind;
  text: string;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asName = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asNames = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(asName).filter((n): n is string => !!n) : [];

const asCount = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

/**
 * context_stats is jsonb with a different shape per mood, so every field is
 * probed defensively. Anything missing, malformed or from an unrecognised
 * mood returns null and the line is not rendered at all - a partial sentence
 * is worse than silence. `weekend` never renders: its own payload says
 * geolocation is not provided server-side, so there is nothing true to say.
 */
function buildContextLine(
  mood: ExploreMoodId,
  raw: unknown,
  t: (key: string, opts?: Record<string, unknown>) => string,
): HeroContextLine | null {
  const stats = asRecord(raw);
  if (!stats) return null;

  if (mood === 'foryou') {
    const similar = asName(stats.similar_to);
    if (!similar) return null;
    return { kind: 'similar', text: t('hero.contextSimilar', { name: similar }) };
  }

  if (mood === 'friends') {
    const names = asNames(stats.top_friend_names);
    const total = asCount(stats.friends_played_count) ?? names.length;
    if (names.length === 0) return null;
    if (names.length === 1) {
      return { kind: 'friends', text: t('hero.contextFriendsOne', { name1: names[0] }) };
    }
    const more = total - 2;
    if (names.length === 2 && more <= 0) {
      return {
        kind: 'friends',
        text: t('hero.contextFriendsTwo', { name1: names[0], name2: names[1] }),
      };
    }
    if (more <= 0) return null;
    return {
      kind: 'friends',
      text: t('hero.contextFriendsMany', { name1: names[0], name2: names[1], count: more }),
    };
  }

  if (mood === 'bucket') {
    const count = asCount(stats.wishlist_count_in_network);
    if (count == null) return null;
    return { kind: 'bucket', text: t('hero.contextBucket', { count }) };
  }

  if (mood === 'hidden') {
    const count = asCount(stats.review_count);
    const avgRaw = typeof stats.avg_rating === 'number' ? stats.avg_rating : Number(stats.avg_rating);
    if (count == null || !Number.isFinite(avgRaw)) return null;
    return {
      kind: 'hidden',
      text: t('hero.contextHidden', { count, avg: formatRatingValue(Number(avgRaw)) }),
    };
  }

  // weekend and any unrecognised mood: render nothing.
  return null;
}

function CoursesPageHeroInner() {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { mood } = useExploreMood();
  const { data: hero, isLoading } = useExploreHero(user?.id, mood);

  const background = useMemo(() => {
    if (hero?.hero_image_url) {
      return buildOverviewHeroBackground(hero.hero_image_url);
    }
    return COURSE_GRADIENT;
  }, [hero?.hero_image_url]);

  const locationText = hero
    ? [hero.location_primary, hero.location_secondary].filter(Boolean).join(' · ')
    : '';

  const blurb = hero?.why_ai?.trim() ? hero.why_ai.trim() : null;

  const contextLine = useMemo(
    () => (hero ? buildContextLine(mood, hero.context_stats, t) : null),
    [hero, mood, t],
  );

  // Analytics: how often a blurb actually exists decides whether
  // course_mood_blurbs is worth investing in.
  useEffect(() => {
    if (!hero?.course_id || !blurb) return;
    analyticsEvents.track('hero_blurb_shown', { course_id: hero.course_id, mood });
  }, [hero?.course_id, blurb, mood]);

  useEffect(() => {
    if (!hero?.course_id || !contextLine) return;
    analyticsEvents.track('hero_context_shown', {
      course_id: hero.course_id,
      mood,
      kind: contextLine.kind,
    });
  }, [hero?.course_id, contextLine, mood]);

  const eyebrowParts = hero
    ? [hero.list_label, hero.location_primary, hero.rating_avg != null ? formatRatingValue(Number(hero.rating_avg)) : null]
        .filter(Boolean)
    : [];


  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: '100%',
        minHeight: HERO_MIN_HEIGHT,
        background,
        backgroundColor: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Bottom-anchored identity + CTA */}
      <div
        style={{
          marginTop: 'auto',
          padding: '0 16px 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {isLoading || !hero ? (
          <div style={{ opacity: 0.35 }}>
            <div
              className="animate-pulse"
              style={{ height: 12, width: 220, background: 'rgba(255,255,255,0.28)', borderRadius: 4, marginBottom: 12 }}
            />
            <div
              className="animate-pulse"
              style={{ height: 44, width: '70%', background: 'rgba(255,255,255,0.28)', borderRadius: 6, marginBottom: 12 }}
            />
            <div
              className="animate-pulse"
              style={{ height: 20, width: '50%', background: 'rgba(255,255,255,0.22)', borderRadius: 4 }}
            />
          </div>
        ) : (
          <>
            {eyebrowParts.length > 0 && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#F7931E',
                  marginBottom: 8,
                  fontFeatureSettings: '"tnum" 1',
                }}
              >
                {eyebrowParts.join(' · ')}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              {hero.list_rank != null && (
                <span
                  style={{
                    fontSize: 44,
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                    fontFeatureSettings: '"tnum" 1',
                  }}
                >
                  #{hero.list_rank}
                </span>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1.15,
                    letterSpacing: '-0.01em',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {hero.course_name}
                </div>
                {locationText && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'rgba(255,255,255,0.72)',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {locationText}
                  </div>
                )}
              </div>
            </div>

            {/* Blurb: absent for most moods, so the gap closes with it. */}
            {blurb && (
              <div
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.9)',
                  lineHeight: 1.45,
                  maxWidth: 340,
                  marginTop: 12,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {blurb}
              </div>
            )}

            {contextLine && (
              <div
                style={{
                  marginTop: blurb ? 10 : 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: '#F7931E',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12.5,
                    color: 'rgba(255,255,255,0.72)',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {contextLine.text}
                </span>
              </div>
            )}

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  analyticsEvents.track('hero_view_course', {
                    course_id: hero.course_id,
                    mood,
                    had_blurb: !!blurb,
                  });
                  navigate(`/courses/${hero.course_id}`);
                }}

                className="active:scale-[0.98] transition-transform"
                style={{
                  background: '#fff',
                  color: '#15171F',
                  fontSize: 12.5,
                  fontWeight: 800,
                  letterSpacing: '-0.005em',
                  padding: '10px 16px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('hero.viewCourse')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const CoursesPageHero = memo(CoursesPageHeroInner);
export default CoursesPageHero;
