import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Crown, Flag, Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreHero } from '@/components/explore-tab-new/hooks/useExploreHero';
import { useExploreMood } from '@/components/explore-tab-new/hooks/useExploreMood';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatRatingValue } from '@/utils/formatters';
import { formatNumber } from '@/i18n/format';
import { useHeroCourseFact, type HeroCourseFactRow } from '@/hooks/courses/useHeroCourseFact';
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
 * Copy surfaces: `why_ai` (course_mood_blurbs) from get_explore_hero, and
 * a single true data line from get_hero_course_fact. The old context line
 * built from `context_stats` is gone - it claimed similarity clbhouz could
 * not support.
 *
 * Analytics callsites:
 *  - hero_blurb_shown   { course_id, mood }                (blurb effect)
 *  - hero_fact_shown    { course_id, fact_kind, rounds_tracked, player_count }
 *  - hero_view_course   { course_id, mood, had_blurb }     (CTA onClick)
 */

const HERO_MIN_HEIGHT =
  'calc(clamp(280px, 35dvh, 390px) + env(safe-area-inset-top, 0px))';

/** 1st, 2nd, 3rd, 11th - never "The 11 plays hardest". */
function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

const oneDecimal = (n: number) => Math.abs(n).toFixed(1);

/**
 * Branch on fact_kind ONLY. A hardest_hole row still carries hole data
 * when the record line won, so inferring the fact from field presence
 * would break the one-fact rule.
 */
function buildFactLine(
  fact: HeroCourseFactRow,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string | null {
  if (fact.fact_kind === 'course_record') {
    if (fact.record_gross == null || !fact.record_holder) return null;
    return t('hero.factBestRound', {
      gross: fact.record_gross,
      holder: fact.record_holder,
    });
  }

  if (fact.fact_kind === 'hardest_hole') {
    if (fact.hole_no == null || fact.hole_over == null) return null;
    return t('hero.factHardestHole', {
      hole: ordinal(Number(fact.hole_no)),
      over: `+${oneDecimal(Number(fact.hole_over))}`,
    });
  }

  if (fact.fact_kind === 'over_par') {
    const avg = fact.avg_over_par == null ? null : Number(fact.avg_over_par);
    if (avg == null || !Number.isFinite(avg)) return null;
    const rounded = Number(oneDecimal(avg));
    if (rounded === 0) return t('hero.factLevelPar');
    if (avg < 0) return t('hero.factUnderPar', { over: oneDecimal(avg) });
    return t('hero.factOverPar', { over: `+${oneDecimal(avg)}` });
  }

  return null;
}

/**
 * The fact line's mark. A crown belongs to course_record ONLY — it is this
 * app's mark for a course record (gam_course_legends are "crowns"). The other
 * kinds take icons that match their own meaning; a crown on an over-par fact
 * would claim something untrue.
 *
 * Colour matches the text beside it, never amber: amber is reserved for the
 * viewing member and the record holder is usually somebody else.
 */
const FACT_ICON_COLOR = 'rgba(255,255,255,0.72)';

function FactIcon({ fact }: { fact: HeroCourseFactRow }) {
  // 13px sits on the 12.5px line by cap height rather than line box.
  const props = { size: 13, strokeWidth: 2, color: FACT_ICON_COLOR, 'aria-hidden': true } as const;

  if (fact.fact_kind === 'course_record') return <Crown {...props} />;
  // A single hole playing hardest — the flagstick is that hole.
  if (fact.fact_kind === 'hardest_hole') return <Flag {...props} />;
  if (fact.fact_kind === 'over_par') {
    const avg = fact.avg_over_par == null ? null : Number(fact.avg_over_par);
    if (avg == null || !Number.isFinite(avg)) return null;
    const rounded = Number(oneDecimal(avg));
    if (rounded === 0) return <Minus {...props} />;
    return avg < 0 ? <TrendingDown {...props} /> : <TrendingUp {...props} />;
  }
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

  const { data: fact } = useHeroCourseFact(hero?.course_id);

  const factLine = useMemo(
    () => (fact ? buildFactLine(fact, t) : null),
    [fact, t],
  );

  // Analytics: how often a blurb actually exists decides whether
  // course_mood_blurbs is worth investing in.
  useEffect(() => {
    if (!hero?.course_id || !blurb) return;
    analyticsEvents.track('hero_blurb_shown', { course_id: hero.course_id, mood });
  }, [hero?.course_id, blurb, mood]);

  useEffect(() => {
    if (!hero?.course_id || !fact || !factLine) return;
    analyticsEvents.track('hero_fact_shown', {
      course_id: hero.course_id,
      fact_kind: fact.fact_kind,
      rounds_tracked: fact.rounds_tracked,
      player_count: fact.player_count,
    });
  }, [hero?.course_id, fact, factLine]);

  /* Eyebrow tail: the rating when there is one, otherwise the round count
     from the fact row. Both absent leaves the location as the last part. */
  const eyebrowTail =
    hero?.rating_avg != null
      ? formatRatingValue(Number(hero.rating_avg))
      : fact?.rounds_tracked
        ? t('holes.rounds', {
            count: fact.rounds_tracked,
            formattedCount: formatNumber(fact.rounds_tracked),
          })
        : null;

  const eyebrowParts = hero
    ? [hero.list_label, hero.location_primary, eyebrowTail].filter(Boolean)
    : [];



  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: '100%',
        minHeight: HERO_MIN_HEIGHT,
        background,
        backgroundColor: '#15171F',
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
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.62)',
                  marginBottom: 8,
                  fontFeatureSettings: '"tnum" 1',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}
              >
                {eyebrowParts.join(' · ')}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              {hero.list_rank != null && (
                <span
                  style={{
                    fontSize: 39,
                    fontWeight: 700,
                    color: '#fff',
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                    fontFeatureSettings: '"tnum" 1',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  #{hero.list_rank}
                </span>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 18.5,
                    fontWeight: 700,
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
                      fontSize: 11,
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
                  fontSize: 13.5,
                  color: 'rgba(255,255,255,0.9)',
                  lineHeight: 1.45,
                  maxWidth: 340,
                  marginTop: 10,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {blurb}
              </div>
            )}

            {factLine && (
              <div
                style={{
                  marginTop: blurb ? 10 : 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                {fact && (
                  <span style={{ display: 'flex', flexShrink: 0 }}>
                    <FactIcon fact={fact} />
                  </span>
                )}

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
                  {factLine}
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
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  padding: '9px 15px',
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
