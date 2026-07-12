import { useMemo } from 'react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import type { FeatRow, FeatTier } from './hooks/useRegionFeats';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const CARD_W = 226;
const CARD_H = 215;

// Tier accents (drives tick, WHS mark, legendary glow + avatar ring).
const ACCENT: Record<FeatTier, string> = {
  legendary: '#FBBC2E',
  records: '#7DD3FC',
  eagles: '#22C55E',
  birdie_hauls: '#F7931E',
};

const TIER_LABEL: Record<FeatTier, string> = {
  legendary: 'LEGENDARY',
  records: 'COURSE RECORD',
  eagles: 'EAGLE',
  birdie_hauls: 'BIRDIE HAUL',
};

const RECORD_CATEGORY_LABEL: Record<string, string> = {
  lowest_gross_all_time: 'COURSE RECORD',
  best_stableford_all_time: 'STABLEFORD RECORD',
};

function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A golfer';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}

function initials(name: string): string {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

function relDate(iso?: string | null): string {
  if (!iso) return '';
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
  row: FeatRow;
  tier: FeatTier;
  onTap?: () => void;
}

export function FeatCard({ row, tier, onTap }: Props) {
  const isLegendary = tier === 'legendary';
  const isRecord = tier === 'records';
  const image = row.course_image ?? row.thumbnail_image ?? null;
  const holder = formatHolderName(row.holder_name);
  const accent = ACCENT[tier];

  const chipLabel = isRecord
    ? (RECORD_CATEGORY_LABEL[row.category ?? ''] ?? 'COURSE RECORD')
    : isLegendary
      ? (row.feat_type === 'albatross'
          ? 'ALBATROSS'
          : row.feat_type === 'ace'
            ? 'HOLE-IN-ONE'
            : 'LEGENDARY')
      : TIER_LABEL[tier];

  const heroValue = useMemo(() => {
    if (isRecord) {
      if (row.value == null) return '';
      const v = Number(row.value);
      switch (row.category) {
        case 'lowest_gross_all_time':
          return `GROSS ${v}`;
        case 'best_stableford_all_time':
          return `${v} PTS`;
        default:
          return String(row.value).toUpperCase();
      }
    }
    return (row.feat_value ?? '').toUpperCase();
  }, [isRecord, row.category, row.feat_value, row.value]);

  const when = relDate(row.play_date ?? row.attained_at ?? null);

  const boxShadow = isLegendary
    ? '0 0 0 1px #FBBC2E55, 0 10px 28px rgba(0,0,0,0.35)'
    : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.28)';

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
      {/* Full-bleed image */}
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

      {/* Obsidian scrim — smooth eased ramp (many small alpha deltas to
          avoid mobile-OLED banding). */}
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
          {chipLabel}
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

      {/* Hero value + course name (above lower-third strip) */}
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
            src={row.holder_avatar}
            alt={holder}
            fallback={initials(holder)}
            hairlineRing
            ringColor={isLegendary ? accent : 'rgba(255,255,255,0.22)'}
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
          {holder}
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

export default FeatCard;
