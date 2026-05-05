import React from 'react';
import { Info, Swords, Pencil } from 'lucide-react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendRivalryHydrated } from '@/lib/whs/types';

interface Props {
  rivalry: FriendRivalryHydrated;
  onInfo: () => void;
  onEdit: () => void;
  onTap: () => void;
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

const slotLabel = (kind: string): string => {
  switch (kind) {
    case 'chasing': return 'CHASING';
    case 'chased_by': return 'CHASED BY';
    case 'pinned': return 'PINNED RIVAL';
    default: return 'RIVAL';
  }
};

export const RivalryCard: React.FC<Props> = ({ rivalry, onInfo, onEdit, onTap }) => {
  const name = rivalry.rival_name ?? 'Unknown';
  const sf = rivalry.stableford_record ?? { wins: 0, losses: 0, ties: 0 };
  const gross = rivalry.gross_record ?? { wins: 0, losses: 0, ties: 0 };
  const results = rivalry.shared_round_results ?? [];
  const lastEight = results.slice(0, 8);
  const totalGames = sf.wins + sf.losses + sf.ties;

  const hasH2H = rivalry.shared_rounds_count > 0;

  // Verdict
  let verdict = 'EVEN MATCH';
  let verdictColor = T.whiteMute;
  if (hasH2H) {
    if (sf.wins > sf.losses) {
      verdict = 'YOU LEAD';
      verdictColor = T.green;
    } else if (sf.losses > sf.wins) {
      verdict = 'THEY LEAD';
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
      onClick={onTap}
      role="button"
      tabIndex={0}
      style={{
        flex: '0 0 auto',
        width: 264,
        scrollSnapAlign: 'start',
        background: `linear-gradient(160deg, ${T.bgFrom}, ${T.bgTo})`,
        borderRadius: 18,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        fontFamily: FONT_DISPLAY,
        boxShadow: '0 1px 2px rgba(15,23,42,0.06), 0 8px 24px -8px rgba(15,23,42,0.18)',
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

      {/* Header row: eyebrow + (i) + edit */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.16em',
              color: T.amber,
            }}
          >
            {slotLabel(rivalry.slot_kind)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onInfo(); }}
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
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          aria-label="Edit rival"
          style={{
            width: 24,
            height: 24,
            padding: 0,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${T.hairline}`,
            cursor: 'pointer',
            color: T.whiteMute,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Pencil size={11} strokeWidth={2} />
        </button>
      </div>

      {/* Avatar + Name + HCP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px 12px' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
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
            {firstName(name)} {(name.includes(',') ? name.split(',')[0].trim() : (name.split(' ')[1] ?? '')).slice(0, 1) && (name.includes(',') ? name.split(',')[0].trim() : (name.split(' ').slice(1).join(' ')))}
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

      {/* W / L / T block */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          margin: '0 14px',
          padding: '10px 0',
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
            textAlign: 'center',
            borderLeft: i > 0 ? `1px solid ${T.hairline}` : 'none',
          }}>
            <p style={{
              margin: 0,
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.18em',
              color: T.whiteSoft,
              marginBottom: 2,
            }}>{s.label}</p>
            <p style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 900,
              color: hasH2H ? s.color : T.whiteSoft,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Form bar — last 8 outcomes */}
      <div style={{ padding: '12px 14px 10px' }}>
        <p style={{
          margin: 0,
          fontSize: 8,
          fontWeight: 900,
          letterSpacing: '0.18em',
          color: T.whiteSoft,
          marginBottom: 6,
        }}>
          FORM · LAST 8
        </p>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const r = lastEight[i];
            let bg = 'rgba(255,255,255,0.08)';
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Swords size={12} strokeWidth={2.2} color={verdictColor} />
              <span style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '0.14em',
                color: verdictColor,
              }}>
                {verdict}
              </span>
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.whiteMute,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.02em',
            }}>
              GROSS {gross.wins}-{gross.losses}-{gross.ties}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default RivalryCard;
