import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExploreRecommendations, type ExploreRecRow } from './hooks/useExploreRecommendations';
import type { ExploreMoodId } from './hooks/useExploreMood';

interface ExploreRecommendationsProps {
  userId: string | undefined;
  mood: ExploreMoodId;
}

const MOOD_HEADINGS: Record<ExploreMoodId, string> = {
  foryou: 'Picked for you',
  weekend: 'Within reach this weekend',
  friends: 'Your friends just played',
  hidden: 'Hidden gems worth the detour',
  bucket: 'Bucket-list contenders',
};

const MOOD_SUBHEADS: Record<ExploreMoodId, string> = {
  foryou: 'Based on what you rate highly',
  weekend: 'Day-trip distance from your home base',
  friends: 'Recently logged by people you follow',
  hidden: 'Highly rated, lightly travelled',
  bucket: 'The trips most often saved',
};

function RecCard({ rec, onTap }: { rec: ExploreRecRow; onTap: () => void }) {
  const initial = (rec.course_name || '?').charAt(0).toUpperCase();
  return (
    <button
      type="button"
      onClick={onTap}
      className="block text-left active:scale-[0.99] transition-transform"
      style={{
        width: 240,
        flexShrink: 0,
        background: '#FFFFFF',
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0F172A' }}>
        {rec.hero_image_url ? (
          <img
            src={rec.hero_image_url}
            alt={rec.course_name}
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 56,
              fontWeight: 900,
            }}
          >
            {initial}
          </div>
        )}
        {rec.match_label && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#0F172A',
              background: 'rgba(255,255,255,0.95)',
              padding: '3px 7px',
              borderRadius: 4,
            }}
          >
            {rec.match_label}
          </span>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: '#0F172A',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {rec.course_name}
        </h3>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'rgba(15,23,42,0.6)',
            margin: '2px 0 8px',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {[rec.location_primary, rec.location_secondary].filter(Boolean).join(' · ')}
        </p>
        {rec.why_ai && (
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.4,
              color: 'rgba(15,23,42,0.75)',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {rec.why_ai}
          </p>
        )}
        {rec.rating_avg != null && (rec.review_count ?? 0) > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#F7931E' }}>
              {Number(rec.rating_avg).toFixed(1)}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(15,23,42,0.5)' }}>
              · {rec.review_count}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function ExploreRecommendationsInner({ userId, mood }: ExploreRecommendationsProps) {
  const navigate = useNavigate();
  const { data: recs = [], isLoading } = useExploreRecommendations(userId, mood, 4);

  if (isLoading) {
    return (
      <section style={{ padding: '20px 0 0' }}>
        <div style={{ padding: '0 16px 12px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
            {MOOD_HEADINGS[mood]}
          </h2>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="animate-pulse"
              style={{ width: 240, height: 280, flexShrink: 0, background: 'rgba(15,23,42,0.06)', borderRadius: 14 }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (recs.length === 0) {
    if (mood === 'friends') {
      return (
        <section style={{ padding: '24px 16px 0' }}>
          <div style={{ padding: '0 0 12px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F7931E', margin: 0 }}>
              From your friends
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: '4px 0 0', lineHeight: 1.15 }}>
              No friends' rounds yet
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(15,23,42,0.55)', margin: '2px 0 0', fontWeight: 500 }}>
              When the people you follow log a round, you'll see their recent courses here.
            </p>
          </div>
        </section>
      );
    }
    return null;
  }

  const tier = recs[0]?.filter_tier;
  const tierLabel =
    tier === 'expanded' ? 'Broader set' :
    tier === 'relaxed' ? 'Widened the net' :
    tier === 'played_included' ? 'Including some you have played' :
    null;

  return (
    <section style={{ padding: '24px 0 0' }}>
      <div style={{ padding: '0 16px 12px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
          {MOOD_HEADINGS[mood]}
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(15,23,42,0.55)', margin: '2px 0 0', fontWeight: 500 }}>
          {tierLabel ?? MOOD_SUBHEADS[mood]}
        </p>
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
        {recs.map(rec => (
          <RecCard key={rec.course_id} rec={rec} onTap={() => navigate(`/courses/${rec.course_id}`)} />
        ))}
      </div>
    </section>
  );
}

export const ExploreRecommendations = memo(ExploreRecommendationsInner);
