import React from 'react';
import { Info } from 'lucide-react';
import { initials } from '@/lib/whs/utils/initials';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendRivalryHydrated } from '@/lib/whs/types';

interface Props {
  rivalry: FriendRivalryHydrated;
  onInfo: () => void;
}

const T = {
  bgFrom: '#0F172A',
  bgTo: '#1e293b',
  amber: '#F7931E',
  amberLight: '#F59E0B',
  amberDeep: '#FFB459',
  amberRingOuter: 'rgba(247,147,30,0.15)',
  amberRingInner: 'rgba(247,147,30,0.10)',
  white: '#FFFFFF',
  whiteMute: 'rgba(148,163,184,1)',
  whiteSoft: 'rgba(255,255,255,0.35)',
  hairline: 'rgba(247,147,30,0.18)',
  green: '#34D399',
  red: '#F87171',
  grey: 'rgba(255,255,255,0.40)',
  tileBg: 'rgba(255,255,255,0.05)',
};
const FONT_DISPLAY = 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const RivalryCard: React.FC<Props> = ({ rivalry, onInfo }) => {
  const name = rivalry.rival_name ?? 'Unknown';
  const sf = rivalry.stableford_record ?? { wins: 0, losses: 0, ties: 0 };
  const gross = rivalry.gross_record ?? { wins: 0, losses: 0, ties: 0 };
  const results = rivalry.shared_round_results ?? [];
  const lastEight = results.slice(0, 8);

  const hasH2H = rivalry.shared_rounds_count > 0;

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
        minHeight: 240,
        scrollSnapAlign: 'start',
        borderRadius: 16,
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${T.bgFrom} 0%, ${T.bgTo} 100%)`,
        position: 'relative',
        fontFamily: FONT_DISPLAY,
        boxShadow: '0 8px 24px -10px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.06) inset',
        padding: 16,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -40,
          top: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          border: `1px solid ${T.amberRingOuter}`,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -20,
          top: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: `1px solid ${T.amberRingInner}`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          position: 'relative',
        }}
      >
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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 14,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '34%',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.10)',
            border: `1px solid rgba(255,255,255,0.10)`,
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 6,
          marginBottom: 12,
          position: 'relative',
        }}
      >
        {[
          { label: 'W', value: sf.wins, labelColor: T.green },
          { label: 'L', value: sf.losses, labelColor: T.red },
          { label: 'T', value: sf.ties, labelColor: T.grey },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: T.tileBg,
              border: `1px solid ${T.hairline}`,
              borderRadius: 10,
              padding: '10px 6px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.10em',
                color: hasH2H ? s.labelColor : T.whiteSoft,
                marginBottom: 4,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: hasH2H ? T.amber : T.whiteSoft,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 12, position: 'relative' }}>
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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: `0.5px solid ${T.hairline}`,
          position: 'relative',
        }}
      >
        {footerLine ? (
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              color: footerLine.color,
              letterSpacing: '-0.005em',
            }}
          >
            {footerLine.text}
          </p>
        ) : (
          <>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.white,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.005em',
              }}
            >
              You {sf.wins}{'\u2013'}{sf.losses} them ·{' '}
              <span
                style={{
                  color: verdictColor,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                }}
              >
                {verdict}
              </span>
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.55)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}
            >
              GROSS {gross.wins}{'\u2013'}{gross.losses}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default RivalryCard;
