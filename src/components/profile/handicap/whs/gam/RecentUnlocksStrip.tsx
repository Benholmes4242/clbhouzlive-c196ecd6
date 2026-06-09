import React from 'react';
import { useRecentUnlocks } from '@/hooks/gam/useRecentUnlocks';
import { useMarkBadgeSeen } from '@/hooks/gam/useMarkBadgeSeen';
import { Skeleton, RetryStub } from '../../gam/_shared/GamAtoms';
import { relativeTime } from '@/lib/gam/visuals';
import type { RecentUnlock } from '@/lib/gam/types';
import { openGamAchievements } from './events';
import { renderBadgeIcon } from './badgeIcons';
import { RARITY_DARK } from './tokens';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const RAIL_INSET = 0;

interface RecentUnlocksStripProps {
  userId: string;
  readOnly?: boolean;
}

/**
 * Eyebrow label + pulse state for a hero card.
 */
function getEyebrow(
  occurredAt: string,
  isLatest: boolean,
): { label: string; pulse: boolean } {
  const t = new Date(occurredAt).getTime();
  if (!Number.isFinite(t)) return { label: '', pulse: false };
  const hoursAgo = (Date.now() - t) / (1000 * 60 * 60);

  if (isLatest) return { label: 'Just unlocked', pulse: true };
  if (hoursAgo < 24) return { label: 'Earlier today', pulse: false };
  if (hoursAgo < 168) return { label: 'This week', pulse: false };
  return { label: relativeTime(occurredAt), pulse: false };
}

const UnlockHeroCard: React.FC<{
  unlock: RecentUnlock;
  isLatest: boolean;
  onTap: () => void;
}> = ({ unlock, isLatest, onTap }) => {
  const [pressed, setPressed] = React.useState(false);
  const rarity = RARITY_DARK[unlock.rarity as keyof typeof RARITY_DARK] ?? RARITY_DARK.common;
  const eyebrow = getEyebrow(unlock.occurred_at, isLatest);

  const composedShadow = [rarity.glow, rarity.outerGlow]
    .filter(Boolean)
    .join(', ') || undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        position: 'relative',
        margin: '0 16px',
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${rarity.cardBorder}`,
        background: rarity.cardSweep,
        boxShadow: composedShadow,
        minHeight: 230,
        padding: '18px 18px 16px',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 140ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        fontFamily: FONT,
        WebkitTapHighlightColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {rarity.topStripe && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: rarity.topStripe,
          }}
        />
      )}

      {/* Decorative backdrop icon */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -20,
          bottom: -30,
          opacity: 0.05,
          transform: 'rotate(-12deg)',
          color: rarity.labelFg,
          pointerEvents: 'none',
          lineHeight: 0,
        }}
      >
        {renderBadgeIcon(unlock.icon, 220, 'currentColor')}
      </div>

      {/* Eyebrow chip */}
      {eyebrow.label && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-start',
            padding: '4px 8px',
            borderRadius: 999,
            background: eyebrow.pulse
              ? 'rgba(247,147,30,0.16)'
              : 'rgba(255,255,255,0.06)',
            border: `1px solid ${
              eyebrow.pulse ? 'rgba(247,147,30,0.40)' : 'rgba(255,255,255,0.10)'
            }`,
            marginBottom: 14,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {eyebrow.pulse && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: '#F7931E',
                animation: 'recentUnlockPulse 1.6s ease-in-out infinite',
              }}
            />
          )}
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: eyebrow.pulse ? '#FBBC2E' : 'var(--hcp-t-60)',
            }}
          >
            {eyebrow.label}
          </span>
        </div>
      )}

      {/* Icon + title + description */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', position: 'relative', zIndex: 1, flex: 1 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: rarity.iconBg,
            border: `1px solid ${rarity.iconRing}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {renderBadgeIcon(unlock.icon, 30, rarity.labelFg)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--hcp-t-100)',
              lineHeight: 1.1,
              marginBottom: 6,
            }}
          >
            {unlock.title}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 400,
              color: 'var(--hcp-t-60)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {unlock.description}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 999,
            background: rarity.labelBg,
            border: `1px solid ${rarity.pillBorder}`,
            color: rarity.labelFg,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}
        >
          ★ {unlock.rarity}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--hcp-t-40)',
            letterSpacing: '0.04em',
          }}
        >
          {relativeTime(unlock.occurred_at)}
        </span>
      </div>
    </div>
  );
};

/**
 * Dot pager — centred tappable dots, active dot is an 18px pill.
 */
const DotPager: React.FC<{
  total: number;
  current: number;
  onChange: (n: number) => void;
}> = ({ total, current, onChange }) => {
  if (total <= 1) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to unlock ${i + 1}`}
          aria-current={i === current ? 'true' : undefined}
          onClick={() => i !== current && onChange(i)}
          style={{
            width: i === current ? 18 : 6,
            height: 6,
            borderRadius: 999,
            background:
              i === current ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)',
            border: 'none',
            padding: 0,
            cursor: i === current ? 'default' : 'pointer',
            transition: 'all 200ms ease',
            WebkitTapHighlightColor: 'transparent',
          }}
        />
      ))}
    </div>
  );
};

const SectionHeader: React.FC<{ page: number; total: number }> = ({ page, total }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      marginBottom: 10,
      marginTop: 32,
      fontFamily: FONT,
    }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--hcp-t-60)',
      }}
    >
      <span style={{ color: '#F7931E', marginRight: 6 }}>•</span>
      RECENT UNLOCKS
    </div>
  </div>
);

const RecentUnlocksStrip: React.FC<RecentUnlocksStripProps> = ({
  userId,
  readOnly: _readOnly = false,
}) => {
  const { data, isLoading, isError, refetch } = useRecentUnlocks(userId);
  const [page, setPage] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const newPage = Math.round(el.scrollLeft / el.clientWidth);
    if (newPage !== page) setPage(newPage);
  }, [page]);

  const handlePagerChange = React.useCallback((n: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * n, behavior: 'smooth' });
    setPage(n);
  }, []);

  if (isError) {
    return (
      <div style={{ padding: '0 16px', marginTop: 32 }}>
        <RetryStub
          message="Couldn't load recent unlocks"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <SectionHeader page={0} total={0} />
        <div style={{ padding: `0 ${RAIL_INSET}px` }}>
          <Skeleton height={192} width="100%" radius={16} />
        </div>
      </>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  const total = data.length;

  return (
    <>
      <style>{`
        @keyframes recentUnlockPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
      `}</style>

      <SectionHeader page={page} total={total} />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="gam-no-scrollbar"
        style={{
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingLeft: RAIL_INSET,
          paddingRight: RAIL_INSET,
          scrollPaddingLeft: RAIL_INSET,
          scrollPaddingRight: RAIL_INSET,
          paddingBottom: 4,
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {data.map((unlock, idx) => (
          <div
            key={`${unlock.kind}-${idx}-${unlock.occurred_at}`}
            style={{
              flex: '0 0 calc(88vw - 28px)',
              scrollSnapAlign: 'start',
              boxSizing: 'border-box',
            }}
          >
            <UnlockHeroCard
              unlock={unlock}
              isLatest={idx === 0}
              onTap={() => openGamAchievements()}
            />
          </div>
        ))}
      </div>

      <DotPager total={total} current={page} onChange={handlePagerChange} />
    </>
  );
};

export default RecentUnlocksStrip;
