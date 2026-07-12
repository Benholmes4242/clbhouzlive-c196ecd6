import { useState, useMemo } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { AlmanacHead } from './AlmanacSections';
import {
  useCircleActivity,
  type CircleActivityRow,
  type CircleFeatType,
} from './hooks/useCircleActivity';
import {
  INK_MUTE,
  HAIRLINE_INK_8,
  INK_TINT_06,
} from '@/features/courses/_shared/tokens';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const CARD_W = 226;
const CARD_H = 215;
const AMBER_TEXT = '#c97a10';

// Label per feat_type — cards are emoji-free; FEAT_META (with emojis) is
// preserved elsewhere for other consumers, but broadcast tiles use text only.
const FEAT_LABEL: Record<CircleFeatType, string> = {
  ace: 'HOLE-IN-ONE',
  albatross: 'ALBATROSS',
  eagle: 'EAGLE',
  birdie_haul: 'BIRDIE HAUL',
  under_par: 'UNDER PAR',
  pb_gross: 'PERSONAL BEST',
  pb_stableford: 'PERSONAL BEST',
  stableford: 'STABLEFORD',
};

// Accent per feat_type — drives tick, WHS mark, legendary glow + avatar ring.
const FEAT_ACCENT: Record<CircleFeatType, string> = {
  ace: '#FBBC2E',
  albatross: '#FBBC2E',
  eagle: '#22C55E',
  birdie_haul: '#F7931E',
  under_par: '#22C55E',
  pb_gross: '#7DD3FC',
  pb_stableford: '#7DD3FC',
  stableford: '#F7931E',
};
const FALLBACK_LABEL = 'HIGHLIGHT';
const FALLBACK_ACCENT = '#F7931E';

function isLegendaryFeat(t: CircleFeatType | undefined): boolean {
  return t === 'ace' || t === 'albatross';
}

function formatFriendName(raw: string): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A friend';
  if (s.includes(',')) {
    const [last, first] = s.split(',').map((x) => x.trim());
    if (first && last) return `${first} ${last}`;
    return s;
  }
  return s;
}

function initials(name: string): string {
  const parts = (name || '').replace(',', ' ').split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

function relDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startToday - that) / 86400000);
  if (days <= 0) return 'TODAY';
  if (days === 1) return 'YESTERDAY';
  if (days < 7) return `${days}D AGO`;
  if (days < 30) return `${Math.floor(days / 7)}W AGO`;
  if (days < 365) return `${Math.floor(days / 30)}MO AGO`;
  return `${Math.floor(days / 365)}Y AGO`;
}

interface Props {
  userId?: string;
}

export function CircleActivityStrip({ userId }: Props) {
  const { data, isLoading } = useCircleActivity(userId);
  const [sheet, setSheet] = useState<{ scoreId: string; connectionId: string } | null>(null);

  const rows = useMemo(() => data ?? [], [data]);

  const Header = <AlmanacHead title="Your friends" />;

  if (isLoading) {
    return (
      <section style={{ fontFamily: FONT }}>
        {Header}
      <div
        className="flex gap-3 px-4 overflow-x-auto scrollbar-hide"
        style={{ paddingTop: 4, marginTop: -4, paddingBottom: 16, marginBottom: -16 }}>
          {Array.from({ length: 2 }).map((_v, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                flexShrink: 0,
                width: CARD_W,
                height: CARD_H,
                borderRadius: 16,
                background: INK_TINT_06,
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section style={{ fontFamily: FONT }}>
        {Header}
        <div style={{ padding: '0 16px 8px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: `1px solid ${HAIRLINE_INK_8}`,
              borderRadius: 16,
              padding: '16px',
              fontSize: 14,
              fontWeight: 600,
              color: INK_MUTE,
              lineHeight: 1.45,
            }}
          >
            No highlights from your circle yet —{' '}
            <span style={{ color: AMBER_TEXT, fontWeight: 800 }}>go set the pace.</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ fontFamily: FONT }}>
      {Header}
      <div
        className="flex gap-3 px-4 overflow-x-auto scrollbar-hide"
        style={{ paddingTop: 4, marginTop: -4, paddingBottom: 16, marginBottom: -16 }}>
        {rows.map((r, i) => (
          <CircleActivityCard
            key={`${r.score_id}-${i}`}
            row={r}
            onTap={() => setSheet({ scoreId: r.score_id, connectionId: r.connection_id })}
          />
        ))}
      </div>

      <RoundDetailSheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        scoreId={sheet?.scoreId ?? null}
        connectionId={sheet?.connectionId ?? null}
        variant="light"
      />
    </section>
  );
}

interface CardProps {
  row: CircleActivityRow;
  onTap: () => void;
}

function CircleActivityCard({ row, onTap }: CardProps) {
  const label = FEAT_LABEL[row.feat_type] ?? FALLBACK_LABEL;
  const accent = FEAT_ACCENT[row.feat_type] ?? FALLBACK_ACCENT;
  const legendary = isLegendaryFeat(row.feat_type);
  const friend = formatFriendName(row.friend_name);
  const image = row.course_image ?? null;
  const heroValue = (row.feat_value ?? '').toUpperCase();
  const when = row.play_date ? relDate(row.play_date) : '';

  const boxShadow = legendary
    ? '0 0 0 1px #FBBC2E55, 0 4px 12px rgba(0,0,0,0.20)'
    : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 3px 10px rgba(15,23,42,0.14)';

  const fallbackBg = 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)';

  return (
    <button
      type="button"
      onClick={onTap}
      className="text-left active:scale-[0.98] transition-transform"
      style={{
        position: 'relative',
        flexShrink: 0,
        width: CARD_W,
        height: CARD_H,
        background: image ? '#07080C' : fallbackBg,
        borderRadius: 16,
        overflow: 'hidden',
        padding: 0,
        cursor: 'pointer',
        fontFamily: FONT,
        boxShadow,
        border: 'none',
      }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : null}

      {/* Obsidian scrim */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(7,8,12,0.28) 0%, rgba(7,8,12,0.10) 22%, rgba(7,8,12,0.00) 38%, rgba(7,8,12,0.06) 50%, rgba(7,8,12,0.18) 60%, rgba(7,8,12,0.34) 70%, rgba(7,8,12,0.52) 79%, rgba(7,8,12,0.70) 87%, rgba(7,8,12,0.86) 94%, rgba(7,8,12,0.94) 100%)',
        }}
      />

      {/* Top-left: tick + typographic label */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'block',
            width: 3,
            height: 12,
            borderRadius: 1,
            background: accent,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(248,244,232,0.92)',
            lineHeight: 1,
          }}
        >
          {label}
        </span>
      </div>

      {/* Top-right: when */}
      {when ? (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(248,244,232,0.55)',
            lineHeight: 1,
          }}
        >
          {when}
        </div>
      ) : null}

      {/* Hero value + course name */}
      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {heroValue ? (
          <div
            style={{
              fontSize: 27,
              fontWeight: 900,
              letterSpacing: '-0.015em',
              lineHeight: 1,
              color: '#F8F4E8',
              fontVariantNumeric: 'tabular-nums',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {heroValue}
          </div>
        ) : null}
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: 'rgba(248,244,232,0.75)',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.course_name}
        </div>
      </div>

      {/* Lower-third holder strip */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '8px 14px 10px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <SquircleAvatar
            size={26}
            src={row.friend_avatar}
            alt={friend}
            fallback={initials(row.friend_name)}
            hairlineRing
            ringColor={legendary ? accent : 'rgba(255,255,255,0.22)'}
          />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12.5,
            fontWeight: 700,
            color: '#F8F4E8',
            lineHeight: 1.15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: FONT,
          }}
        >
          {friend}
        </div>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: accent,
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          WHS
        </span>
      </div>
    </button>
  );
}

export default CircleActivityStrip;
