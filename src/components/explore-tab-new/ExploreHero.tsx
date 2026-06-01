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
        style={{ height: HERO_HEIGHT, background: INK_TINT_06 }}
      />
    );
  }

  if (!hero) return null;

  const tierLabel = hero.filter_tier ? TIER_LABELS[hero.filter_tier] ?? '' : '';

  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${hero.course_id}`)}
      className="block w-full text-left active:scale-[0.99] transition-transform"
      style={{
        position: 'relative',
        width: '100%',
        height: HERO_HEIGHT,
        overflow: 'hidden',
        background: SLATE_50,
        flexShrink: 0,
        border: 'none',
        padding: 0,
      }}
    >
      <style>{`
        @keyframes clbhzHeroZoom { from { transform: scale(1.06); } to { transform: scale(1.16); } }
        .clbhz-hero-img { animation: clbhzHeroZoom 18s ease-out forwards; transform-origin: center; }
        @media (prefers-reduced-motion: reduce) {
          .clbhz-hero-img { animation: none !important; transform: scale(1.04) !important; }
        }
      `}</style>

      {hero.hero_image_url ? (
        <img
          src={hero.hero_image_url}
          alt={hero.course_name}
          loading="lazy"
          className="clbhz-hero-img"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', willChange: 'transform' }}
        />
      ) : (
        <FallbackImage name={hero.course_name} />
      )}

      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: VIGNETTE, pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: CINEMATIC_SCRIM, pointerEvents: 'none' }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 16px 18px',
          color: SURFACE,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
          {hero.global_rank ? (
            <span
              style={{
                display: 'inline-flex', alignItems: 'center',
                fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.95)',
                padding: '5px 9px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              #{hero.global_rank} WORLD
            </span>
          ) : null}
        </div>

        <div style={{ flex: 1 }} />

        {tierLabel && (
          <p style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
            color: AMBER, margin: '0 0 8px', textShadow: '0 1px 6px rgba(0,0,0,0.4)',
          }}>
            {tierLabel}
          </p>
        )}
        <h2
          style={{
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: '-0.025em',
            lineHeight: 0.98,
            margin: 0,
            color: SURFACE,
            textShadow: '0 2px 16px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          {hero.course_name}
        </h2>
        <p style={{
          fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.88)',
          margin: '10px 0 0', textShadow: '0 1px 8px rgba(0,0,0,0.4)',
        }}>
          {[hero.location_primary, hero.location_secondary].filter(Boolean).join(' · ')}
        </p>
        {hero.rating_avg != null && (hero.review_count ?? 0) > 0 && (
          <div
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 14,
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <img src={clbhouzLogo} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: AMBER }}>
              {Number(hero.rating_avg).toFixed(1)}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>
              · {hero.review_count} review{hero.review_count === 1 ? '' : 's'}
            </span>
          </div>
        )}

        <span
          style={{
            position: 'absolute',
            bottom: 18,
            right: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: AMBER,
            textShadow: '0 1px 8px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ fontSize: 13, lineHeight: 1 }}>🔥</span>
          Featured
        </span>
      </div>
    </button>
  );
}

export const ExploreHero = memo(ExploreHeroInner);
