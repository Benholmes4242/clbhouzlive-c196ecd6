import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreHero } from '@/components/explore-tab-new/hooks/useExploreHero';
import { useExploreMood } from '@/components/explore-tab-new/hooks/useExploreMood';
import { formatRatingValue } from '@/utils/formatters';

/**
 * CoursesPageHero
 * ---------------
 * Shared cinematic hero rendered above the Discover / Courses / Top 100
 * tabs on /courses. Uses the SAME mechanics as GolfClubView's cinematic
 * hero (notch bleed, scrim, cover position) and the SAME data source as
 * the old Discover "Standout courses" card (useExploreHero).
 *
 * The global CompactHeader floats over this hero in transparent overlay
 * mode; this component reserves that space via env(safe-area-inset-top).
 */

const HERO_SCRIM =
  'linear-gradient(180deg, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.12) 22%, rgba(15,23,42,0) 42%, rgba(15,23,42,0) 55%, rgba(15,23,42,0.6) 100%)';

const HERO_MIN_HEIGHT =
  'calc(clamp(380px, 44dvh, 460px) + env(safe-area-inset-top, 0px))';

function CoursesPageHeroInner() {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { mood } = useExploreMood();
  const { data: hero, isLoading } = useExploreHero(user?.id, mood);

  const background = useMemo(() => {
    if (hero?.hero_image_url) {
      return `${HERO_SCRIM}, url(${hero.hero_image_url}) center 40% / cover no-repeat`;
    }
    return 'linear-gradient(180deg,#1E4D38,#0F172A)';
  }, [hero?.hero_image_url]);

  const locationText = hero
    ? [hero.location_primary, hero.location_secondary].filter(Boolean).join(' · ')
    : '';

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

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => navigate(`/courses/${hero.course_id}`)}
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
