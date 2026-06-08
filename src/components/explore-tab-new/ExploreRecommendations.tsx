import { memo, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useExploreRecommendations, type ExploreRecRow } from './hooks/useExploreRecommendations';
import type { ExploreMoodId } from './hooks/useExploreMood';
import clbhouzLogo from '@/assets/clbhouz-logo.png';
import { ExploreSectionHeader } from './ExploreSectionHeader';
import { AMBER, INK, INK_ALPHA_60, INK_TINT_06, SLATE_50, SURFACE } from '@/features/courses/_shared/tokens';

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
        background: SURFACE,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: SLATE_50 }}>
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
              color: INK,
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
            color: INK,
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
            color: INK_ALPHA_60,
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
            <img src={clbhouzLogo} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: AMBER }}>
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
  const isPicked = mood === 'foryou';
  const { data: recs = [], isLoading } = useExploreRecommendations(
    userId,
    mood,
    isPicked ? 15 : 4,
    { fresh: isPicked },
  );

  const seedRef = useRef(Math.random());
  const displayRecs = useMemo<ExploreRecRow[]>(() => {
    if (!isPicked) return recs;
    if (recs.length === 0) return recs;
    const seen = new Set<string>();
    const unique: ExploreRecRow[] = [];
    for (const r of recs) {
      if (seen.has(r.course_id)) continue;
      seen.add(r.course_id);
      unique.push(r);
    }
    let s = Math.floor(seedRef.current * 2 ** 32) || 1;
    const rand = () => {
      s |= 0;
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const arr = unique.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 3);
  }, [recs, isPicked]);

  if (isLoading) {
    return (
      <section style={{ padding: '20px 0 0' }}>
        <ExploreSectionHeader title={MOOD_HEADINGS[mood]} icon={Sparkles} paddingTop={0} />
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="animate-pulse"
              style={{ width: 240, height: 280, flexShrink: 0, background: INK_TINT_06, borderRadius: 14 }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (displayRecs.length === 0) {
    if (mood === 'friends') {
      return (
        <section style={{ padding: '0 0 0' }}>
          <ExploreSectionHeader
            title="No friends' rounds yet"
            icon={Sparkles}
            sub="When the people you follow log a round, you'll see their recent courses here."
          />
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
    <section style={{ padding: '0 0 0' }}>
      <ExploreSectionHeader
        title={MOOD_HEADINGS[mood]}
        icon={Sparkles}
        sub={tierLabel ?? MOOD_SUBHEADS[mood]}
      />
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
        {recs.map(rec => (
          <RecCard key={rec.course_id} rec={rec} onTap={() => navigate(`/courses/${rec.course_id}`)} />
        ))}
      </div>
    </section>
  );
}

export const ExploreRecommendations = memo(ExploreRecommendationsInner);
