import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExploreHeroRow } from './hooks/useExploreHero';
import { useExploreHero } from './hooks/useExploreHero';
import type { ExploreMoodId } from './hooks/useExploreMood';
import clbhouzLogo from '@/assets/clbhouz-logo.png';
import { AMBER, INK_TINT_06, SLATE_50, SURFACE } from '@/features/courses/_shared/tokens';

interface ExploreHeroProps {
  userId: string | undefined;
  mood: ExploreMoodId;
}

const HERO_HEIGHT = 448; // 560 − 20%
const CINEMATIC_SCRIM =
  'linear-gradient(to top, rgba(5,9,15,0.97) 0%, rgba(5,9,15,0.78) 24%, rgba(5,9,15,0.30) 50%, rgba(5,9,15,0.10) 72%, rgba(5,9,15,0.30) 100%)';
const VIGNETTE =
  'radial-gradient(120% 90% at 50% 38%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)';

const TIER_LABELS: Record<string, string> = {
  strict: '',
  expanded: 'Broader pick',
  relaxed: 'Wider net',
  played_included: "You've played this — worth a return",
};

function FallbackImage({ name }: { name: string }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.45)',
        fontSize: 96,
        fontWeight: 900,
        letterSpacing: '-0.04em',
      }}
    >
      {initial}
    </div>
  );
}

function ExploreHeroInner({ userId, mood }: ExploreHeroProps) {
  const navigate = useNavigate();
  const { data: hero, isLoading } = useExploreHero(userId, mood);

  if (isLoading) {
    return (
      <div
        className="w-full animate-pulse"
        style={{ height: 560, background: INK_TINT_06 }}
      />
    );
  }

  if (!hero) return null;

  const tierLabel = hero.filter_tier ? TIER_LABELS[hero.filter_tier] ?? '' : '';
  const CINEMATIC_SCRIM =
    'linear-gradient(to top, rgba(7,12,20,0.94) 0%, rgba(7,12,20,0.55) 32%, rgba(7,12,20,0.12) 56%, rgba(7,12,20,0.22) 100%)';

  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${hero.course_id}`)}
      className="block w-full text-left active:scale-[0.99] transition-transform"
      style={{
        position: 'relative',
        width: '100%',
        height: 560,
        overflow: 'hidden',
        background: SLATE_50,
        flexShrink: 0,
        border: 'none',
        padding: 0,
      }}
    >
      {hero.hero_image_url ? (
        <img
          src={hero.hero_image_url}
          alt={hero.course_name}
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
      ) : (
        <FallbackImage name={hero.course_name} />
      )}

      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: CINEMATIC_SCRIM }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '18px 14px 16px',
          color: SURFACE,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: AMBER,
            }}
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>🔥</span>
            Featured
          </span>
          {hero.global_rank ? (
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.65)' }}>
              #{hero.global_rank} WORLD
            </span>
          ) : null}
        </div>

        <div style={{ flex: 1 }} />

        {tierLabel && (
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.75)', margin: '0 0 6px',
          }}>
            {tierLabel}
          </p>
        )}
        <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.0, margin: 0, color: SURFACE }}>
          {hero.course_name}
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)', margin: '8px 0 0' }}>
          {[hero.location_primary, hero.location_secondary].filter(Boolean).join(' · ')}
        </p>
        {hero.why_ai && (
          <p style={{
            fontSize: 13, lineHeight: 1.45, color: 'rgba(255,255,255,0.92)', margin: '10px 0 0',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {hero.why_ai}
          </p>
        )}
        {hero.rating_avg != null && (hero.review_count ?? 0) > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <img src={clbhouzLogo} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: AMBER }}>
              {Number(hero.rating_avg).toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              · {hero.review_count} review{hero.review_count === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

export const ExploreHero = memo(ExploreHeroInner);
