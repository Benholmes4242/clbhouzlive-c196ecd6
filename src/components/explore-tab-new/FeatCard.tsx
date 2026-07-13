import { useMemo } from 'react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import type { FeatRow, FeatTier } from './hooks/useRegionFeats';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export type FeatCardSize = 'default' | 'compact';

const SIZE_MAP: Record<FeatCardSize, {
  w: number; h: number;
  value: number; label: number; avatar: number;
  padX: number; padY: number;
  heroBottom: number; footerBottom: number; footerPadTop: number;
  courseFs: number; holderFs: number; whenFs: number;
}> = {
  default: {
    w: 226, h: 183,
    value: 34, label: 9.5, avatar: 24,
    padX: 14, padY: 14,
    heroBottom: 54, footerBottom: 12, footerPadTop: 10,
    courseFs: 11, holderFs: 12, whenFs: 9.5,
  },
  compact: {
    w: 158, h: 112,
    value: 19, label: 8.5, avatar: 16,
    padX: 10, padY: 10,
    heroBottom: 34, footerBottom: 8, footerPadTop: 6,
    courseFs: 9.5, holderFs: 10.5, whenFs: 8.5,
  },
};

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
  size?: FeatCardSize;
}

export function FeatCard({ row, tier, onTap, size = 'default' }: Props) {
  const S = SIZE_MAP[size];
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
    ? '0 0 0 1px #FBBC2E55, 0 4px 12px rgba(0,0,0,0.20)'
    : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 3px 10px rgba(15,23,42,0.14)';

  const fallbackBg = '#0A0C10';

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

      {/* Heavy dark veil - photo becomes texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(155deg, rgba(10,12,16,0.72), rgba(10,12,16,0.90))',
        }}
      />

      {/* Top-left: feat label (accent color) */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: isLegendary ? accent : '#F7931E',
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
            top: 14,
            right: 14,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1,
          }}
        >
          {when}
        </div>
      ) : null}

      {/* Hero stat + course name (above footer) */}
      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 54,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {heroValue ? (
          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 0.95,
              color: '#ffffff',
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
            marginTop: 4,
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.course_name}
        </div>
      </div>

      {/* Footer holder strip */}
      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 12,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <SquircleAvatar
            size={24}
            src={row.holder_avatar}
            alt={holder}
            fallback={initials(holder)}
            hairlineRing
            ringColor={isLegendary ? accent : 'rgba(255,255,255,0.25)'}
          />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: FONT,
          }}
        >
          {holder}
        </div>
      </div>
    </button>
  );
}

export default FeatCard;
