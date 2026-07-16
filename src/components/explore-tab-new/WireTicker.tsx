import { useMemo, useRef, useState, useEffect } from 'react';
import { useCircleActivity, type CircleActivityRow, type CircleFeatType } from './hooks/useCircleActivity';
import { useScorecardOpener } from './useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const CHIP_LABEL: Record<CircleFeatType, string> = {
  ace: 'ACE',
  albatross: 'ALBATROSS',
  eagle: 'EAGLE',
  birdie_haul: 'HAUL',
  under_par: 'UNDER PAR',
  pb_gross: 'RECORD',
  pb_stableford: 'RECORD',
  stableford: 'RECORD',
};

function formatFriendName(raw: string): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A friend';
  if (s.includes(',')) {
    const [last, first] = s.split(',').map((x) => x.trim());
    if (first && last) return `${first} ${last}`;
  }
  return s;
}

function achievementPhrase(row: CircleActivityRow): string {
  const t = row.feat_type;
  if (t === 'ace') return 'made an ace';
  if (t === 'albatross') return 'made an albatross';
  if (t === 'eagle') return 'made an eagle';
  if (t === 'birdie_haul') return 'racked up a birdie haul';
  if (t === 'under_par') return 'went under par';
  if (t === 'pb_gross') return 'set a personal best';
  if (t === 'pb_stableford') return 'set a personal best';
  if (t === 'stableford') return 'posted a stableford';
  return 'set a mark';
}

const TICKER_STYLE_ID = 'almanac-ticker-keyframes';
function ensureTickerStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(TICKER_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = TICKER_STYLE_ID;
  style.textContent = `
@keyframes almanac-ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.almanac-ticker-track {
  display: flex;
  align-items: center;
  gap: 24px;
  width: max-content;
  animation: almanac-ticker-scroll 28s linear infinite;
  will-change: transform;
}
.almanac-ticker-track[data-paused="true"] { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .almanac-ticker-track { animation: none !important; }
}
`;
  document.head.appendChild(style);
}

interface Props {
  userId?: string;
}

export function WireTicker({ userId }: Props) {
  const { data } = useCircleActivity(userId);
  const { target, openByScore, close } = useScorecardOpener();
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    ensureTickerStyles();
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const items = useMemo(() => (data ?? []).slice(0, 8), [data]);
  // Duplicate the sequence once so translateX(-50%) yields a seamless join.
  const loopItems = useMemo(() => [...items, ...items], [items]);

  const trackRef = useRef<HTMLDivElement | null>(null);

  if (items.length === 0) return null;

  const renderItem = (r: CircleActivityRow, i: number) => {
    const friend = formatFriendName(r.friend_name);
    const chipLabel = CHIP_LABEL[r.feat_type] ?? 'HIGHLIGHT';
    const detail = (r.feat_value ?? '').trim();
    const phrase = achievementPhrase(r);
    const text = `${friend} · ${phrase} at ${r.course_name}${detail ? ` · ${detail}` : ''}`;
    return (
      <button
        key={`${r.score_id}-${i}`}
        type="button"
        onClick={() => openByScore(r.score_id, r.connection_id, r.friend_user_id)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'transparent',
        border: 'none',
        padding: 0,
        paddingBlock: 12,
        marginBlock: -12,
        cursor: 'pointer',
        fontFamily: FONT,
        flexShrink: 0,
      }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 6px',
            borderRadius: 4,
            background: '#FBBC2E',
            color: '#0F172A',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            lineHeight: 1.3,
            flexShrink: 0,
          }}
        >
          {chipLabel}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.72)',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          {text}
        </span>
      </button>
    );
  };

  const content = reducedMotion ? (
    <div
      className="flex items-center overflow-x-auto scrollbar-hide"
      style={{ gap: 24, padding: '0 14px' }}
    >
      {items.map(renderItem)}
    </div>
  ) : (
    <div style={{ overflow: 'hidden', padding: '0 14px' }}>
      <div
        ref={trackRef}
        className="almanac-ticker-track"
        data-paused={paused || undefined}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onTouchCancel={() => setPaused(false)}
      >
        {loopItems.map(renderItem)}
      </div>
    </div>
  );

  return (
    <section
      style={{
        background: '#15171F',
        height: 36,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        overflowX: 'hidden',
        overflowY: 'visible',
      }}
      aria-label="Friends achievements ticker"
    >
      {content}
      <RoundDetailSheet
        open={!!target}
        onClose={close}
        scoreId={target?.scoreId ?? null}
        connectionId={target?.connectionId ?? null}
        profileUserId={target?.profileUserId ?? null}
      />
    </section>
  );
}

export default WireTicker;
