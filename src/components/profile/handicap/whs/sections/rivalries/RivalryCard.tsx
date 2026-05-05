import React from 'react';
import { Info, Swords } from 'lucide-react';
import { initials } from '@/lib/whs/utils/initials';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendRivalryHydrated } from '@/lib/whs/types';

interface Props {
  rivalry: FriendRivalryHydrated;
  onInfo: () => void;
}

const T = {
  bgFrom: '#0a1628',
  bgTo: '#060c16',
  amber: '#F7931E',
  amberDeep: '#FFB459',
  white: '#FFFFFF',
  whiteMute: 'rgba(255,255,255,0.55)',
  whiteSoft: 'rgba(255,255,255,0.35)',
  hairline: 'rgba(255,255,255,0.10)',
  green: '#34D399',
  red: '#F87171',
  grey: 'rgba(255,255,255,0.40)',
};
const FONT_DISPLAY = 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const RivalryCard: React.FC<Props> = ({ rivalry, onInfo }) => {
  const name = rivalry.rival_name ?? 'Unknown';
  const sf = rivalry.stableford_record ?? { wins: 0, losses: 0, ties: 0 };
  const gross = rivalry.gross_record ?? { wins: 0, losses: 0, ties: 0 };
  const results = rivalry.shared_round_results ?? [];
  const lastEight = results.slice(0, 8);

  const hasH2H = rivalry.shared_rounds_count > 0;

  // Verdict
  let verdict = 'EVEN';
  let verdictColor: string = 'rgba(255,255,255,0.55)';
  if (hasH2H) {
    if (sf.wins > sf.losses) {
      verdict = 'AHEAD';
      verdictColor = T.green;
    } else if (sf.losses > sf.wins) {
      verdict = 'BEHIND';
      verdictColor = T.red;
    }
  }

  // Footer fallback for empty H2H
  let footerLine: { text: string; color: string } | null = null;
  if (!hasH2H) {
    if (!rivalry.rival_is_clbhouz_user) {
      footerLine = { text: 'Invite to unlock H2H', color: T.amberDeep };
    } else if (!rivalry.rival_friend_connection_id) {
      footerLine = { text: 'Ask them to sync', color: T.whiteMute };
    } else {
      footerLine = { text: 'No shared rounds yet', color: T.whiteMute };
    }
  }

  return (
    <div
      style={{
        flex: '0 0 auto',
        width: 'calc(88vw - 16px)',
        maxWidth: 320,
        minHeight: 220,
        scrollSnapAlign: 'start',
        borderRadius: 18,
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${T.bgFrom}, ${T.bgTo})`,
        position: 'relative',
        fontFamily: FONT_DISPLAY,
        boxShadow: '0 8px 24px -10px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.06) inset',
      }}
    >
      {/* Amber stripe top */}
      <div
        aria-hidden
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${T.amber} 0%, ${T.amberDeep} 100%)`,
        }}
      />

      {/* Header row: eyebrow + (i) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.18em',
              color: T.amber,
            }}
          >
            RIVAL
          </span>
          <button
            onClick={onInfo}
            aria-label="Why this rival?"
            style={{
              width: 18,
              height: 18,
              padding: 0,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: T.whiteSoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Info size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Avatar + Name + HCP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px 10px' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '34%',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.10)',
            border: `1px solid ${T.hairline}`,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {rivalry.rival_thumbnail_url ? (
            <img
              src={rivalry.rival_thumbnail_url}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 14, fontWeight: 800, color: T.white }}>
              {initials(name)}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 800,
              color: T.white,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {reformatFriendName(name)}
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 11,
              color: T.whiteMute,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.02em',
            }}
          >
            HCP {fmtHcp(rivalry.rival_handicap)}
          </p>
        </div>
      </div>

      {/* W / L / T block — compact horizontal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 12px',
          padding: '8px 0',
          borderTop: `1px solid ${T.hairline}`,
          borderBottom: `1px solid ${T.hairline}`,
        }}
      >
        {[
          { label: 'W', value: sf.wins, color: T.green },
          { label: 'L', value: sf.losses, color: T.red },
          { label: 'T', value: sf.ties, color: T.grey },
        ].map((s, i) => (
          <div key={s.label} style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            flex: 1,
            justifyContent: 'center',
            borderLeft: i > 0 ? `1px solid ${T.hairline}` : 'none',
          }}>
            <span style={{
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.18em',
              color: T.whiteSoft,
            }}>{s.label}</span>
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              color: hasH2H ? s.color : T.whiteSoft,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Form bar — last 8 outcomes (no label) */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const r = lastEight[i];
            let bg = 'rgba(255,255,255,0.12)';
            if (r) {
              if (r.stableford_outcome === 'W') bg = T.green;
              else if (r.stableford_outcome === 'L') bg = T.red;
              else bg = T.grey;
            }
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 2,
                  background: bg,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px 14px',
        borderTop: `1px solid ${T.hairline}`,
      }}>
        {footerLine ? (
          <p style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            color: footerLine.color,
            letterSpacing: '-0.005em',
          }}>
            {footerLine.text}
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              <Swords size={13} strokeWidth={2.4} color={verdictColor} />
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '-0.005em',
              }}>
                You {sf.wins}{'\u2013'}{sf.losses} them{' \u00b7 '}
                <span style={{ color: verdictColor, fontWeight: 800, letterSpacing: '0.06em' }}>
                  {verdict}
                </span>
              </span>
            </div>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.55)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
              marginLeft: 8,
              flexShrink: 0,
            }}>
              GROSS {gross.wins}{'\u2013'}{gross.losses}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default RivalryCard;
