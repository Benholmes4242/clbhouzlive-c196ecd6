import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useHeroStories, type HeroStoryRow, type HeroStoryKind } from './hooks/useHeroStories';
import { useScorecardOpener } from './useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import { toParText } from './hooks/useRegionFeats';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const GOLD = '#FBBC2E';
const UNDER_PAR = '#FF4D57';

const HERO_MIN_HEIGHT =
  'calc(clamp(380px, 44dvh, 460px) + env(safe-area-inset-top, 0px))';

const KIND_LABEL: Record<HeroStoryKind, string> = {
  course_record: 'COURSE RECORD',
  ace: 'HOLE-IN-ONE',
  albatross: 'ALBATROSS',
  eagle: 'EAGLE',
  birdie_haul: 'BIRDIE HAUL',
};

function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A golfer';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}

function initials(name: string): string {
  return (
    (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

interface HeroSlideProps {
  story: HeroStoryRow;
  onOpenScore: (scoreId: string, userId: string | null) => void;
  onOpenProfile: (userId: string) => void;
}

function HeroSlide({ story, onOpenScore, onOpenProfile }: HeroSlideProps) {
  const holder = formatHolderName(story.holder_name);
  const overline = `${KIND_LABEL[story.kind] ?? story.kind.toUpperCase()} · THE AMATEUR CIRCUIT`;

  let bigValue = '';
  let bigColor = '#FFFFFF';
  let microLabel = '';
  let subLine: string | null = null;

  if (story.kind === 'course_record') {
    if (story.value != null && story.course_par != null) {
      const d = story.value - story.course_par;
      bigValue = toParText(d);
      if (d < 0) bigColor = UNDER_PAR;
      microLabel = `${story.value} GROSS`;
    } else if (story.value != null) {
      bigValue = String(story.value);
      microLabel = 'GROSS';
    } else {
      bigValue = '—';
      microLabel = 'GROSS';
    }
  } else if (story.kind === 'birdie_haul') {
    bigValue = story.hole != null ? String(story.hole) : '—';
    microLabel = 'BIRDIES';
    subLine = 'ONE ROUND';
  } else {
    // ace, albatross, eagle
    bigValue = story.hole != null ? String(story.hole) : '—';
    microLabel = 'HOLE';
    if (story.kind === 'albatross' && story.course_par != null) {
      subLine = `PAR ${story.course_par} · IN 2`;
    }
  }

  const canOpenScore = !!story.score_id;
  const canOpenProfile = !!story.user_id;
  const showCta = canOpenScore || canOpenProfile;

  const handleCta = () => {
    if (canOpenScore) onOpenScore(story.score_id!, story.user_id);
    else if (canOpenProfile) onOpenProfile(story.user_id!);
  };

  return (
    <div
      style={{
        position: 'relative',
        flex: '0 0 100%',
        width: '100%',
        minHeight: HERO_MIN_HEIGHT,
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(165deg, #3E5C3A, #23361F)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        fontFamily: FONT,
      }}
    >
      {story.image ? (
        <img
          src={story.image}
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      ) : null}

      {/* Dual scrim */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0) 24%), linear-gradient(0deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0) 48%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content bottom-anchored */}
      <div
        style={{
          marginTop: 'auto',
          padding: '0 16px 44px',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: GOLD,
              marginBottom: 10,
              lineHeight: 1,
            }}
          >
            {overline}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: '#FFFFFF',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {story.course_name}
          </div>
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
            }}
          >
            <SquircleAvatar
              size={26}
              src={story.holder_avatar}
              alt={holder}
              fallback={initials(holder)}
              hairlineRing
              ringColor={GOLD}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
            >
              {holder}
            </span>
            {story.happened_at ? (
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.60)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {relativeTime(story.happened_at)}
              </span>
            ) : null}
          </div>

          {showCta ? (
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={handleCta}
                className="active:scale-[0.98] transition-transform"
                style={{
                  background: '#FFFFFF',
                  color: '#15171F',
                  fontSize: 13.5,
                  fontWeight: 700,
                  padding: '10px 16px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                View scorecard
              </button>
            </div>
          ) : null}
        </div>

        {/* Right: value block */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            minWidth: 0,
            paddingBottom: 4,
          }}
        >
          <div
            className="tabular-nums"
            style={{
              fontSize: 62,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 0.9,
              color: bigColor,
            }}
          >
            {bigValue}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.58)',
              whiteSpace: 'nowrap',
            }}
          >
            {microLabel}
          </div>
          {subLine ? (
            <div
              style={{
                marginTop: 3,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
                whiteSpace: 'nowrap',
              }}
            >
              {subLine}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface AmateurCircuitHeroProps {
  /** Fallback element to render when stories are empty/errored. */
  fallback: React.ReactNode;
}

function AmateurCircuitHeroInner({ fallback }: AmateurCircuitHeroProps) {
  const { data, isLoading, isError } = useHeroStories();
  const opener = useScorecardOpener();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const stories = data ?? [];
  const count = stories.length;

  // Preload slide 2's image once slide 1 exists
  useEffect(() => {
    if (count >= 2 && stories[1]?.image) {
      const img = new Image();
      img.src = stories[1].image;
    }
  }, [count, stories]);

  // Passive scroll listener → active index
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth || 1;
      const idx = Math.round(el.scrollLeft / w);
      setActiveIndex((prev) => (prev === idx ? prev : idx));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [count]);

  if (isLoading) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: HERO_MIN_HEIGHT,
          background: 'linear-gradient(180deg,#1E4D38,#0F172A)',
        }}
      />
    );
  }

  if (isError || count === 0) {
    return <>{fallback}</>;
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={scrollerRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="hide-scrollbar"
      >
        {stories.map((s, i) => (
          <HeroSlide
            key={`${s.kind}-${s.score_id ?? s.user_id ?? i}`}
            story={s}
            onOpenScore={(scoreId, userId) => opener.openByScore(scoreId, null, userId)}
            onOpenProfile={(userId) => opener.openProfile(userId)}
          />
        ))}
      </div>

      {count > 1 ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {stories.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <span
                key={i}
                style={{
                  width: isActive ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: isActive ? GOLD : 'rgba(255,255,255,0.45)',
                  transition: 'all 250ms ease',
                }}
              />
            );
          })}
        </div>
      ) : null}

      <RoundDetailSheet
        open={!!opener.target}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </div>
  );
}

export const AmateurCircuitHero = memo(AmateurCircuitHeroInner);
export default AmateurCircuitHero;
