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
  'linear-gradient(135deg, #46665a 0%, #2f4a40 100%)';
const SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0) 100%)';
const T = {
  ink: 'var(--hcp-t-100)',
  ink60: 'var(--hcp-t-60)',
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
  const diff = friend.differential;
  return (
    <div style={{ ...STATUS_BASE, display: 'flex', alignItems: 'baseline', gap: 12 }}>
      {sf != null && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--hcp-t-60)', textTransform: 'uppercase' }}>STBL</span>
          <span style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--hcp-t-100)', letterSpacing: '-0.02em', lineHeight: 1 }}>{sf}</span>
        </div>
      )}
      {diff != null && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--hcp-t-60)', textTransform: 'uppercase' }}>DIFF</span>
          <span style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--hcp-t-100)', letterSpacing: '-0.02em', lineHeight: 1 }}>{`${diff > 0 ? '+' : ''}${diff.toFixed(1)}`}</span>
          {diff < 0 && <span style={{ fontSize: 12, marginLeft: 2 }}>🔥</span>}
        </div>
      )}
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
  const [imgFailed, setImgFailed] = React.useState(false);
  const hasImage = !!friend.course_thumbnail_image && !imgFailed;
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
        width: 250,
        borderRadius: 16,
        overflow: 'hidden',
        background: 'var(--hcp-bg-1)',
        border: '0.5px solid var(--hcp-line-2)',
        scrollSnapAlign: 'start',
        cursor: 'pointer',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      {/* Image panel (left) */}
      <div
        style={{
          position: 'relative',
          width: 84,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {hasImage ? (
          <img
            src={friend.course_thumbnail_image!}
            alt={friend.course_name ?? ''}
            onError={() => setImgFailed(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: FALLBACK_BG }} />
            <FlagSilhouetteOverlay opacity={0.18} />
          </>
        )}
        <div style={{ position: 'absolute', inset: 0, background: SCRIM, pointerEvents: 'none' }} />
        {showLowest && (
          <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 2 }}>
            <LowestChip />
          </div>
        )}
      </div>

      {/* Content (right) */}
      <div style={{ flex: 1, minWidth: 0, padding: '11px 13px' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: T.ink,
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
            marginTop: 1,
            fontSize: 10,
            color: T.ink60,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {courseSub ? `${courseTitle} · ${courseSub}` : courseTitle}
        </div>

        <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: T.ink,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {friend.score}
          </span>
          <span style={{ fontSize: 8, fontWeight: 700, color: T.ink60, letterSpacing: '0.1em' }}>
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
