import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Sparkles } from 'lucide-react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import {
  useRivalryDimension,
  type RivalryDimension,
} from '@/lib/whs/utils/useRivalryDimension';
import { useOpenFriendHybridSheet } from '@/components/friend-hybrid-sheet/FriendHybridSheetProvider';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface Props {
  rivalry: FriendRivalryHydrated;
  userName: string | null;
  userThumbnailUrl: string | null;
  userHandicap: number | null;
  onInfo: () => void;
  /**
   * Optional override. When omitted (default), the card owns its own per-rival
   * dimension state via useRivalryDimension(rivalKey) and renders an inline pill.
   */
  dimension?: RivalryDimension;
  /**
   * Label rendered under the LEFT portrait. Defaults to 'YOU' for owner view.
   * In friend view (Phase 3, file 13), secondary cards render the profile
   * owner's name on the left, so the label becomes null (the name speaks for itself).
   */
  selfLabel?: string | null;
  /**
   * When set, card-tap routes to `/handicap/{friendViewOwnerId}/rivalry/{rivalId}`
   * instead of the owner-view `/handicap/rivalry/{rivalId}`. Used for the
   * file-13 friend-view secondary cards (Thomas-vs-X seen by Benjamin).
   */
  friendViewOwnerId?: string;
}

const T = {
  bgFrom: 'var(--hcp-t-100)',
  bgTo: '#1E293B',
  amber: '#F7931E',
  gold: '#FBBC2E',
  amberSoft: 'rgba(247,147,30,0.14)',
  amberInk: '#854F0B',
  white: 'var(--hcp-bg-1)',
  whiteMute: 'rgba(255,255,255,0.55)',
  whiteFaded: 'rgba(255,255,255,0.40)',
  whiteSofter: 'rgba(255,255,255,0.30)',
  whiteSoftest: 'rgba(255,255,255,0.10)',
  green: '#22C55E',
  red: '#DC2626',
  redInk: '#991B1B',
  hairline: 'rgba(255,255,255,0.10)',
  ink: 'var(--hcp-t-100)',
};
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface StreakInfo {
  who: 'you' | 'them';
  count: number;
}

function computeStreak(
  results: FriendRivalryHydrated['shared_round_results'],
  dimension: RivalryDimension,
): StreakInfo | null {
  if (!results || results.length === 0) return null;
  const sorted = [...results].sort(
    (a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime(),
  );
  const pick = (r: typeof sorted[number]) =>
    dimension === 'gross' ? r.gross_outcome : r.stableford_outcome;
  const head = pick(sorted[0]);
  if (head === 'T') return null;
  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (pick(sorted[i]) === head) count++;
    else break;
  }
  return { who: head === 'W' ? 'you' : 'them', count };
}

function fmtDaysAgo(playDate: string): string {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(playDate).getTime()) / (1000 * 60 * 60 * 24)),
  );
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export const RivalryCard: React.FC<Props> = ({
  rivalry,
  userName,
  userThumbnailUrl,
  userHandicap,
  onInfo,
  dimension: dimensionProp,
  selfLabel = 'YOU',
  friendViewOwnerId,
}) => {
  const navigate = useNavigate();
  const { open: openHybridSheet } = useOpenFriendHybridSheet();
  const { user } = useSupabaseSession();
  const viewerId = user?.id ?? null;
  const rivalKey = rivalry.rival_user_id ?? rivalry.rival_friend_row_id ?? null;
  const [ownDimension, setOwnDimension] = useRivalryDimension(rivalKey);
  // Prop wins if explicitly provided; otherwise self-owned per-rival preference.
  const dimension: RivalryDimension = dimensionProp ?? ownDimension;
  const showPill = dimensionProp === undefined;

  const rivalDisplayName = reformatFriendName(rivalry.rival_name ?? 'Unknown');
  const userDisplayName = userName ?? 'You';
  const record =
    (dimension === 'gross' ? rivalry.gross_record : rivalry.stableford_record) ?? {
      wins: 0,
      losses: 0,
      ties: 0,
    };
  const sf = record;
  const results = rivalry.shared_round_results ?? [];
  const hasH2H = rivalry.shared_rounds_count > 0;
  const winning = sf.wins > sf.losses;
  const losing = sf.losses > sf.wins;

  const streak = useMemo(() => computeStreak(results, dimension), [results, dimension]);
  const lastResult = useMemo(() => {
    if (results.length === 0) return null;
    return [...results].sort(
      (a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime(),
    )[0];
  }, [results]);

  const showStreakBanner = streak !== null && streak.count >= 2;

  const youRing = winning ? T.gold : losing ? T.red : T.whiteSofter;
  const themRing = losing ? T.gold : winning ? T.red : T.whiteSofter;
  const youGlow = winning;
  const themGlow = losing;

  const youScoreColor = winning ? T.gold : losing ? T.red : T.whiteFaded;
  const themScoreColor = losing ? T.gold : winning ? T.red : T.whiteFaded;

  // friend_rivalry has no surrogate id — pair-keyed. Route param accepts either
  // rival_user_id (Clbhouz friend) or rival_friend_row_id (non-Clbhouz friend).
  const rivalRouteId = rivalry.rival_user_id ?? rivalry.rival_friend_row_id ?? null;
  const canOpenDeep = hasH2H && !!rivalRouteId;
  const goDeep = () => {
    if (!canOpenDeep) return;
    // File-13 Phase 3: friend-view secondary cards route through the owner's
    // namespace so RivalryPage knows which user owns the rivalry context.
    if (friendViewOwnerId) {
      navigate(`/handicap/${friendViewOwnerId}/rivalry/${rivalRouteId}`);
    } else {
      navigate(`/handicap/rivalry/${rivalRouteId}`);
    }
  };

  return (
    <div
      role={canOpenDeep ? 'button' : undefined}
      tabIndex={canOpenDeep ? 0 : undefined}
      onClick={canOpenDeep ? goDeep : undefined}
      onKeyDown={canOpenDeep ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goDeep(); } } : undefined}
      style={{
        flex: '0 0 auto',
        width: 290,
        scrollSnapAlign: 'start',
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${T.bgFrom} 0%, ${T.bgTo} 100%)`,
        fontFamily: FONT_GEIST,
        color: T.white,
        boxShadow: '0 6px 18px rgba(15,23,42,0.18)',
        cursor: canOpenDeep ? 'pointer' : 'default',
      }}
    >
      {/* Backdrop glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 80% at 100% 0%, rgba(247,147,30,0.20) 0%, rgba(247,147,30,0) 55%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top strip */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderBottom: `1px solid ${T.hairline}`,
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={11} strokeWidth={2.4} color={T.gold} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.16em',
              color: T.gold,
            }}
          >
            HEAD TO HEAD
          </span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: T.whiteMute,
            }}
          >
            {rivalry.shared_rounds_count} ROUNDS
          </span>
          {showPill && hasH2H && rivalKey && (
            <CardDimensionPill value={dimension} onChange={setOwnDimension} />
          )}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 8,
          padding: '18px 14px 16px',
        }}
      >
        <Portrait
          name={userDisplayName}
          label={selfLabel}
          thumbnail={userThumbnailUrl}
          handicap={userHandicap}
          ringColor={youRing}
          ringGlow={youGlow}
        />

        {/* Marquee score */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 92,
          }}
        >
          {hasH2H ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                  fontFamily: FONT_GEIST,
                  fontWeight: 800,
                  fontSize: 38,
                  lineHeight: 1,
                  fontFeatureSettings: '"tnum" 1',
                }}
              >
                <span style={{ color: youScoreColor }}>{sf.wins}</span>
                <span style={{ color: T.whiteSofter, fontSize: 38 }}>{'\u2014'}</span>
                <span style={{ color: themScoreColor }}>{sf.losses}</span>
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.22em',
                  color: T.whiteFaded,
                }}
              >
                VS
              </div>
              {sf.ties > 0 && (
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 10,
                    fontWeight: 700,
                    color: T.whiteFaded,
                    letterSpacing: '0.06em',
                  }}
                >
                  {sf.ties}T
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                fontFamily: FONT_GEIST,
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '0.22em',
                color: T.whiteFaded,
              }}
            >
              VS
            </div>
          )}
        </div>

        <Portrait
          name={rivalDisplayName}
          label={null}
          thumbnail={rivalry.rival_thumbnail_url ?? null}
          handicap={rivalry.rival_handicap ?? null}
          ringColor={themRing}
          ringGlow={themGlow}
        />
      </div>

      {/* Bottom strip */}
      {!hasH2H ? (
        <div
          style={{
            background: T.amberSoft,
            color: T.gold,
            padding: '10px 14px',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textAlign: 'center',
            textTransform: 'uppercase',
            borderTop: `1px solid ${T.hairline}`,
          }}
        >
          {!rivalry.rival_is_clbhouz_user
            ? 'Invite to unlock H2H'
            : !rivalry.rival_friend_connection_id
              ? 'Ask them to sync'
              : 'No shared rounds yet'}
        </div>
      ) : showStreakBanner ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 14px',
            background: streak!.who === 'you' ? T.gold : T.redInk,
            color: streak!.who === 'you' ? T.ink : T.white,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <Flame size={12} strokeWidth={2.4} />
          <span>
            {streak!.count}-round {streak!.who === 'you' ? 'win' : 'loss'} streak
            {lastResult && ` · last ${fmtDaysAgo(lastResult.play_date)}`}
          </span>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: T.whiteMute,
            padding: '10px 14px',
            fontSize: 11,
            fontWeight: 500,
            textAlign: 'center',
            borderTop: `1px solid ${T.hairline}`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {lastResult ? (
            <>
              Last meeting {fmtDaysAgo(lastResult.play_date)}
              {lastResult.course_name && ` at ${lastResult.course_name}`}
            </>
          ) : (
            'Even rivalry'
          )}
        </div>
      )}
    </div>
  );
};

interface PortraitProps {
  name: string;
  label: string | null;
  thumbnail: string | null;
  handicap: number | null;
  ringColor: string;
  ringGlow: boolean;
}

const Portrait: React.FC<PortraitProps> = ({
  name,
  label,
  thumbnail,
  handicap,
  ringColor,
  ringGlow,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
    }}
  >
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: thumbnail ? `url(${thumbnail}) center/cover no-repeat` : 'rgba(255,255,255,0.10)',
        border: `2px solid ${ringColor}`,
        boxShadow: ringGlow ? `0 0 12px ${ringColor}` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--hcp-bg-1)',
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: '0.04em',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {!thumbnail && initials(name)}
    </div>
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.14em',
        color: 'var(--hcp-bg-1)',
        textTransform: 'uppercase',
        maxWidth: 88,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'center',
      }}
    >
      {label ?? firstName(name).toUpperCase()}
    </div>
    {handicap != null && (
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.55)',
          fontFeatureSettings: '"tnum" 1',
        }}
      >
        Hcp {fmtHcp(handicap)}
      </div>
    )}
  </div>
);

// ── Inline per-card dimension pill (STBL ↔ GROSS) ─────────────────────
const CardDimensionPill: React.FC<{
  value: RivalryDimension;
  onChange: (d: RivalryDimension) => void;
}> = ({ value, onChange }) => {
  const opts: { id: RivalryDimension; label: string }[] = [
    { id: 'stableford', label: 'STBL' },
    { id: 'gross', label: 'GROSS' },
  ];
  return (
    <div
      role="tablist"
      aria-label="Scoring dimension"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'inline-flex',
        padding: 2,
        background: 'rgba(0,0,0,0.28)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 999,
        gap: 1,
      }}
    >
      {opts.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={(e) => {
              e.stopPropagation();
              onChange(o.id);
            }}
            style={{
              padding: '2px 7px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontFamily: FONT_GEIST,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.14em',
              background: active ? '#F7931E' : 'transparent',
              color: active ? '#0F172A' : 'rgba(255,255,255,0.55)',
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
};

export default RivalryCard;
