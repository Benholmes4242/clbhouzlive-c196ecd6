import { useMemo } from 'react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { INK, INK_MUTE, HAIRLINE_INK_8, INK_TINT_06 } from '@/features/courses/_shared/tokens';
import { TIER_ICON } from './AlmanacSections';
import type { FeatRow, FeatTier } from './hooks/useRegionFeats';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const CARD_W = 244;

const RING: Record<FeatTier, string> = {
  legendary: '#FBBC2E',
  records: '#3B82F6',
  eagles: '#10B981',
  birdie_hauls: '#F7931E',
};

const TIER_LABEL: Record<FeatTier, string> = {
  legendary: 'LEGENDARY',
  records: 'COURSE RECORD',
  eagles: 'EAGLE',
  birdie_hauls: 'BIRDIE HAUL',
};

const RECORD_CATEGORY_LABEL: Record<string, string> = {
  lowest_gross_all_time: 'Gross record',
  best_stableford_all_time: 'Stableford record',
  best_score_diff_all_time: 'Net record',
  most_birdies_all_time: 'Most birdies',
  most_eagles_all_time: 'Most eagles',
  most_aces_all_time: 'Most aces',
  lowest_gross_90d: 'Gross record',
  best_stableford_90d: 'Stableford record',
  best_score_diff_90d: 'Net record',
  most_birdies_90d: 'Most birdies',
  most_eagles_90d: 'Most eagles',
  most_aces_90d: 'Most aces',
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
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
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
  const ringColor = RING[tier];
  const chipLabel = isRecord
    ? RECORD_CATEGORY_LABEL[row.category ?? ''] ?? 'Course record'
    : TIER_LABEL[tier];
  const value = useMemo(() => {
    if (isRecord) {
      if (row.value == null) return '';
      const v = Number(row.value);
      switch (row.category) {
        case 'most_eagles_all_time':
        case 'most_eagles_90d':
          return `${v} eagle${v === 1 ? '' : 's'}`;
        case 'most_birdies_all_time':
        case 'most_birdies_90d':
          return `${v} birdie${v === 1 ? '' : 's'}`;
        case 'most_aces_all_time':
        case 'most_aces_90d':
          return `${v} ace${v === 1 ? '' : 's'}`;
        case 'lowest_gross_all_time':
        case 'lowest_gross_90d':
          return `Gross ${v}`;
        case 'best_stableford_all_time':
        case 'best_stableford_90d':
          return `${v} pts`;
        case 'best_score_diff_all_time':
        case 'best_score_diff_90d':
        default:
          return String(row.value);
      }
    }
    return row.feat_value ?? '';
  }, [isRecord, row.category, row.feat_value, row.value]);
  const when = relDate(row.play_date ?? row.attained_at ?? null);

  // Palette
  const cardBg = isLegendary
    ? 'linear-gradient(160deg, #0F172A 0%, #1e1b13 60%, #2a1e08 100%)'
    : '#FFFFFF';
  const border = isLegendary ? '1px solid rgba(251,188,46,0.24)' : `1px solid ${HAIRLINE_INK_8}`;
  const nameColor = isLegendary ? '#FFFFFF' : INK;
  const courseColor = isLegendary ? 'rgba(255,255,255,0.72)' : INK_MUTE;
  const valueColor = isLegendary ? '#F8F4E8' : INK;
  const chipBg = isLegendary ? 'rgba(251,188,46,0.14)' : 'rgba(15,23,42,0.05)';
  const chipText = isLegendary ? '#FBBC2E' : INK;
  
  

  return (
    <button
      type="button"
      onClick={onTap}
      className="text-left active:scale-[0.98] transition-transform"
      style={{
        flexShrink: 0,
        width: CARD_W,
        background: cardBg,
        border,
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      {/* Image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 116,
          background: image ? INK_TINT_06 : 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)',
        }}
      >
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15,23,42,0) 40%, rgba(15,23,42,0.82) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 8px',
            borderRadius: 999,
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          <span aria-hidden style={{ fontSize: 11, lineHeight: 1 }}>{TIER_ICON[tier]}</span>
          <span>{chipLabel}</span>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: 8,
            color: '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 700,
            lineHeight: 1.2,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.course_name}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: '10px 12px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <SquircleAvatar
            size={32}
            src={row.holder_avatar}
            alt={holder}
            fallback={initials(holder)}
            ringColor={ringColor}
            thinRing
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              fontWeight: 700,
              color: nameColor,
              lineHeight: 1.15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: FONT,
            }}
          >
            {holder}
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 13,
              fontWeight: 700,
              color: valueColor,
              lineHeight: 1.15,
              fontVariantNumeric: 'tabular-nums',
              fontFamily: FONT,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value}
          </p>
        </div>
        {when && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.03em',
              padding: '3px 7px',
              borderRadius: 999,
              background: chipBg,
              color: chipText,
              flexShrink: 0,
            }}
          >
            {when}
          </span>
        )}
      </div>
    </button>
  );
}

export default FeatCard;
