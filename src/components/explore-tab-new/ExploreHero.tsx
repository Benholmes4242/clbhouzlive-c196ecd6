import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Flame } from 'lucide-react';
import { useExploreHero } from './hooks/useExploreHero';
import type { ExploreMoodId } from './hooks/useExploreMood';
import clbhouzLogo from '@/assets/clbhouz-logo.png';
import { AMBER, INK_TINT_06 } from '@/features/courses/_shared/tokens';

interface ExploreHeroProps {
  userId: string | undefined;
  mood: ExploreMoodId;
}

const KICKER_COLOR = '#c97a10';
const IMAGE_PANEL_SIZE = 124;

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
        fontSize: 56,
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
      <div style={{ padding: '16px 16px 0' }}>
        <div
          style={{
            height: 14,
            width: 140,
            background: INK_TINT_06,
            borderRadius: 4,
            marginBottom: 10,
          }}
          className="animate-pulse"
        />
        <div
          className="animate-pulse"
          style={{
            height: IMAGE_PANEL_SIZE,
            background: INK_TINT_06,
            borderRadius: 16,
            width: '100%',
          }}
        />
      </div>
    );
  }

  if (!hero) return null;

  const locationText = [hero.location_primary, hero.location_secondary]
    .filter(Boolean)
    .join(' · ');
  const hasRating = hero.rating_avg != null && (hero.review_count ?? 0) > 0;

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          color: KICKER_COLOR,
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        <Flame size={11} strokeWidth={2.5} />
        Best of the best
      </div>

      <button
        type="button"
        onClick={() => navigate(`/courses/${hero.course_id}`)}
        className="active:scale-[0.99] transition-transform"
        style={{
          display: 'flex',
          alignItems: 'stretch',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
          border: '1px solid rgba(15,23,42,0.07)',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: IMAGE_PANEL_SIZE,
            minHeight: IMAGE_PANEL_SIZE,
            alignSelf: 'stretch',
            flexShrink: 0,
            background: '#0f172a',
          }}
        >
          {hero.hero_image_url ? (
            <img
              src={hero.hero_image_url}
              alt={hero.course_name}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
          ) : (
            <FallbackImage name={hero.course_name} />
          )}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.55))',
              pointerEvents: 'none',
            }}
          />
          {hero.list_rank != null && (
            <span
              style={{
                position: 'absolute',
                top: 8,
                left: 10,
                fontSize: 44,
                fontWeight: 900,
                color: 'rgba(255,255,255,0.92)',
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              #{hero.list_rank}
            </span>
          )}
          {hero.list_label && (
            <span
              style={{
                position: 'absolute',
                bottom: 8,
                left: 10,
                right: 10,
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.9)',
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {hero.list_label}
            </span>
          )}
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {hero.course_name}
          </h2>
          {locationText && (
            <p
              style={{
                fontSize: 12.5,
                color: '#64748B',
                marginTop: 3,
                marginBottom: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {locationText}
            </p>
          )}
          {hasRating && (
            <div
              style={{
                marginTop: 9,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <img
                src={clbhouzLogo}
                alt=""
                style={{ width: 14, height: 14, objectFit: 'contain' }}
              />
              <span style={{ fontSize: 14, fontWeight: 800, color: AMBER }}>
                {Number(hero.rating_avg).toFixed(1)}
              </span>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>
                · {hero.review_count} review{hero.review_count === 1 ? '' : 's'}
              </span>
              <ChevronRight
                size={16}
                color="#94A3B8"
                style={{ marginLeft: 'auto' }}
              />
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

export const ExploreHero = memo(ExploreHeroInner);
