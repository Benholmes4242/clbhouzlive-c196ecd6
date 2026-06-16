/**
 * FriendPostcard — uniform 168px compact card for the Friends Yesterday row.
 * Status line driven by deriveHeroState. Invite/nudge are passive labels: the
 * card tap opens the unified FriendSheet, which owns the actual invite action.
 */
import React from 'react';
import { ChevronRight, Star } from 'lucide-react';
import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import FlagSilhouetteOverlay from '@/components/whs/FlagSilhouetteOverlay';
import { splitCourseName } from '@/components/profile/handicap/whs/sections/last-round-card/splitCourseName';
import { deriveHeroState, firstNameOf } from './deriveHeroState';

const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const AMBER = '#F7931E';
const GOLD = '#FBBC2E';

const FALLBACK_BG =
  'linear-gradient(180deg, var(--hcp-bg-2) 0%, var(--hcp-bg-3) 100%)';
const SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0) 100%)';

const fmtDiffShort = (d: number | null): string | null => {
  if (d == null) return null;
  const sign = d > 0 ? '+' : '';
  return `${sign}${d.toFixed(1)} diff`;
};


const LowestChip: React.FC = () => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'rgba(0,0,0,0.35)',
      WebkitBackdropFilter: 'blur(8px)',
      backdropFilter: 'blur(8px)',
      borderRadius: 999,
      padding: '3px 8px',
    }}
  >
    <Star size={9} fill={GOLD} color={GOLD} strokeWidth={0} />
    <span
      style={{
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: '0.10em',
        color: GOLD,
      }}
    >
      LOWEST
    </span>
  </div>
);

// ── Status line variants ─────────────────────────────────────────────────────

const STATUS_BASE: React.CSSProperties = {
  marginTop: 7,
  minHeight: 16,
  fontSize: 10.5,
  fontFamily: FONT,
  display: 'flex',
  alignItems: 'center',
  lineHeight: 1.2,
};

const EnrichedStatus: React.FC<{ friend: FriendYesterday }> = ({ friend }) => {
  const sf = friend.stableford;
  const diffText = fmtDiffShort(friend.differential);
  const parts: string[] = [];
  if (sf != null) parts.push(`${sf} pts`);
  if (diffText) parts.push(diffText);
  return (
    <div
      style={{
        ...STATUS_BASE,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.60)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {parts.join(' · ')}
    </div>
  );
};

// State B (synced, summary-only): no status line — the big GROSS already speaks.
const SummaryStatus: React.FC = () => <div style={{ ...STATUS_BASE }} />;


// Passive label — the card tap opens FriendSheet which owns the action.
const PassiveActionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div
    aria-hidden
    style={{
      ...STATUS_BASE,
      fontWeight: 700,
      color: AMBER,
      gap: 2,
    }}
  >
    <span>{label}</span>
    <ChevronRight size={10} strokeWidth={2.5} color={AMBER} />
  </div>
);

const InviteStatus: React.FC = () => <PassiveActionLabel label="Invite to see more" />;
const NudgeStatus: React.FC = () => <PassiveActionLabel label="Ask to sync" />;

// ── Postcard ────────────────────────────────────────────────────────────────

interface Props {
  friend: FriendYesterday;
  showLowest: boolean;
  onClick: () => void;
}

export const FriendPostcard: React.FC<Props> = ({ friend, showLowest, onClick }) => {
  const state = deriveHeroState(friend);
  const { title: courseTitle, suffix: courseSub } = splitCourseName(friend.course_name || '');

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        flex: '0 0 auto',
        width: 168,
        borderRadius: 18,
        overflow: 'hidden',
        background: '#11161d',
        border: '0.5px solid rgba(255,255,255,0.07)',
        scrollSnapAlign: 'start',
        cursor: 'pointer',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Photo header */}
      <div
        style={{
          position: 'relative',
          height: 78,
          width: '100%',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {friend.course_thumbnail_image ? (
          <img
            src={friend.course_thumbnail_image}
            alt={friend.course_name ?? ''}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: FALLBACK_BG }} />
            <FlagSilhouetteOverlay opacity={0.18} />
          </>
        )}
        <div style={{ position: 'absolute', inset: 0, background: SCRIM, pointerEvents: 'none' }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            zIndex: 2,
          }}
        >
          {showLowest && <LowestChip />}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.01em',
          }}
        >
          {firstNameOf(friend.name)}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 10,
            color: 'rgba(255,255,255,0.50)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {courseSub ? `${courseTitle} · ${courseSub}` : courseTitle}
        </div>

        <div
          style={{
            marginTop: 9,
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {friend.score}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.40)',
              letterSpacing: '0.12em',
            }}
          >
            GROSS
          </span>
        </div>

        {state === 'enriched' && <EnrichedStatus friend={friend} />}
        {state === 'summary' && <SummaryStatus />}
        {state === 'invite' && <InviteStatus />}
        {state === 'nudge' && <NudgeStatus />}

      </div>
    </div>
  );
};

export default FriendPostcard;
