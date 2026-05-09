import React, { useMemo } from 'react';
import { Info, Flame, Sparkles } from 'lucide-react';
import { initials } from '@/lib/whs/utils/initials';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendRivalryHydrated } from '@/lib/whs/types';

interface Props {
  rivalry: FriendRivalryHydrated;
  userName: string | null;
  userThumbnailUrl: string | null;
  userHandicap: number | null;
  onInfo: () => void;
}

const T = {
  bgFrom: '#0F172A',
  bgTo: '#1E293B',
  amber: '#F7931E',
  gold: '#FBBC2E',
  amberSoft: 'rgba(247,147,30,0.14)',
  amberInk: '#854F0B',
  white: '#FFFFFF',
  whiteMute: 'rgba(255,255,255,0.55)',
  whiteFaded: 'rgba(255,255,255,0.40)',
  whiteSofter: 'rgba(255,255,255,0.30)',
  whiteSoftest: 'rgba(255,255,255,0.10)',
  green: '#22C55E',
  red: '#DC2626',
  redInk: '#991B1B',
  hairline: 'rgba(255,255,255,0.10)',
  ink: '#0F172A',
};
const FONT_DISPLAY = 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface StreakInfo {
  who: 'you' | 'them';
  count: number;
}

function computeStreak(
  results: FriendRivalryHydrated['shared_round_results'],
): StreakInfo | null {
  if (!results || results.length === 0) return null;
  const sorted = [...results].sort(
    (a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime(),
  );
  const head = sorted[0].stableford_outcome;
  if (head === 'T') return null;
  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].stableford_outcome === head) count++;
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
}) => {
  const rivalDisplayName = reformatFriendName(rivalry.rival_name ?? 'Unknown');
  const userDisplayName = userName ?? 'You';
  const sf = rivalry.stableford_record ?? { wins: 0, losses: 0, ties: 0 };
  const results = rivalry.shared_round_results ?? [];
  const hasH2H = rivalry.shared_rounds_count > 0;
  const winning = sf.wins > sf.losses;
  const losing = sf.losses > sf.wins;

  const streak = useMemo(() => computeStreak(results), [results]);
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

  return (
    <div
      style={{
        flex: '0 0 auto',
        width: 290,
        scrollSnapAlign: 'start',
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${T.bgFrom} 0%, ${T.bgTo} 100%)`,
        fontFamily: '"Geist", system-ui, sans-serif',
        color: T.white,
        boxShadow: '0 6px 18px rgba(15,23,42,0.18)',
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
          <button
            type="button"
            onClick={onInfo}
            aria-label="Rivalry info"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.06)',
              color: T.whiteMute,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Info size={12} strokeWidth={2.2} />
          </button>
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
          label="YOU"
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
                  fontFamily: FONT_DISPLAY,
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
                fontFamily: FONT_DISPLAY,
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
        border: `3px solid ${ringColor}`,
        boxShadow: ringGlow ? `0 0 12px ${ringColor}` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
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
        color: '#FFFFFF',
        textTransform: 'uppercase',
        maxWidth: 88,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'center',
      }}
    >
      {label ?? name.split(' ')[0].toUpperCase()}
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

export default RivalryCard;
