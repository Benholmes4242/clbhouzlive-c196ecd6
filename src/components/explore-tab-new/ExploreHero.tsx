import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExploreHeroRow } from './hooks/useExploreHero';
import { useExploreHero } from './hooks/useExploreHero';
import type { ExploreMoodId } from './hooks/useExploreMood';

interface ExploreHeroProps {
  userId: string | undefined;
  mood: ExploreMoodId;
}

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
      <div className="px-4 pt-4">
        <div
          className="w-full animate-pulse"
          style={{ aspectRatio: '4/5', borderRadius: 16, background: 'rgba(15,23,42,0.06)' }}
        />
      </div>
    );
  }

  if (!hero) return null;

  const tierLabel = hero.filter_tier ? TIER_LABELS[hero.filter_tier] ?? '' : '';

  return (
    <div className="px-4 pt-4">
      <button
        type="button"
        onClick={() => navigate(`/courses/${hero.course_id}`)}
        className="block w-full text-left active:scale-[0.99] transition-transform"
        style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          aspectRatio: '4/5',
          background: '#0F172A',
          boxShadow: '0 4px 20px -8px rgba(15,23,42,0.25)',
        }}
      >
        {hero.hero_image_url ? (
          <img
            src={hero.hero_image_url}
            alt={hero.course_name}
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <FallbackImage name={hero.course_name} />
        )}

        {/* Bottom gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)',
          }}
        />

        {/* Top eyebrow */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              background: 'rgba(247,147,30,0.95)',
              padding: '4px 8px',
              borderRadius: 4,
            }}
          >
            Featured
          </span>
          {hero.global_rank ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#FFFFFF',
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                padding: '4px 8px',
                borderRadius: 12,
              }}
            >
              #{hero.global_rank} World
            </span>
          ) : null}
        </div>

        {/* Bottom content */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            color: '#FFFFFF',
          }}
        >
          {tierLabel && (
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.75)',
                margin: '0 0 6px',
              }}
            >
              {tierLabel}
            </p>
          )}
          <h2
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              margin: 0,
              color: '#FFFFFF',
            }}
          >
            {hero.course_name}
          </h2>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.85)',
              margin: '6px 0 10px',
            }}
          >
            {[hero.location_primary, hero.location_secondary].filter(Boolean).join(' · ')}
          </p>
          {hero.why_ai && (
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.45,
                color: 'rgba(255,255,255,0.92)',
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {hero.why_ai}
            </p>
          )}
          {hero.rating_avg != null && (hero.review_count ?? 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#F7931E' }}>
                {Number(hero.rating_avg).toFixed(1)}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                · {hero.review_count} review{hero.review_count === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

export const ExploreHero = memo(ExploreHeroInner);
