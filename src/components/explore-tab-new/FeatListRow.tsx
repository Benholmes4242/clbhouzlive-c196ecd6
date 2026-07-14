import { useMemo } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { TierGem } from '@/components/shared/TierGem';
import type { FeatRow, FeatTier } from './hooks/useRegionFeats';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const AMBER = '#F7931E';

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
  return (
    (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
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
  index?: number;
  medals?: number | null;
}

// Birdie hauls leaderboard row - gaming-light Discover rebuild spec 3F.
export function FeatListRow({ row, tier, onTap, index = 0, medals }: Props) {
  const holder = useMemo(() => formatHolderName(row.holder_name), [row.holder_name]);
  const when = relDate(row.play_date ?? row.attained_at ?? null);
  const rank = index + 1;
  const isTop = rank === 1;

  // Value + label vary by tier.
  // - records: gross score / GROSS
  // - eagles: hole number (extracted from feat_value) / HOLE
  // - legendary (aces + albatrosses): hole number / HOLE
  // - birdie_hauls: birdie count / BIRDIES
  const { value, label } = useMemo(() => {
    const digits = (s: string | null | undefined): string => {
      const m = (s ?? '').match(/\d+/);
      return m ? m[0] : '';
    };
    if (tier === 'records') {
      const v = row.value != null ? String(row.value) : digits(row.feat_value);
      return { value: v || '—', label: 'GROSS' };
    }
    if (tier === 'eagles' || tier === 'legendary') {
      const v = digits(row.feat_value) || (row.value != null ? String(row.value) : '');
      return { value: v || '—', label: 'HOLE' };
    }
    // birdie_hauls
    const v = (row.feat_value ?? (row.value != null ? String(row.value) : '')).replace(/[^\d.]/g, '');
    return { value: v || '—', label: 'BIRDIES' };
  }, [tier, row.feat_value, row.value]);

  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full text-left active:scale-[0.995] transition-transform"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        borderRadius: 12,
        padding: '10px 12px',
        background: isTop ? 'linear-gradient(100deg, #fff, #fff6e8)' : '#fff',
        border: isTop
          ? '1px solid rgba(247,147,30,0.3)'
          : '1px solid rgba(15,23,42,0.07)',
        marginBottom: 6,
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 24,
          textAlign: 'center',
          flexShrink: 0,
          fontSize: 14,
          fontWeight: 900,
          fontVariantNumeric: 'tabular-nums',
          color: isTop ? AMBER : '#94A3B8',
          lineHeight: 1,
        }}
      >
        {rank}
      </div>
      <div style={{ flexShrink: 0 }}>
        <SquircleAvatar
          size={34}
          src={row.holder_avatar}
          alt={holder}
          fallback={initials(holder)}
          hairlineRing
        />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#0F172A',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {holder}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 11.5,
            fontWeight: 700,
            color: '#64748B',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.course_name}
        </div>
        {when ? (
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              fontWeight: 700,
              color: '#94A3B8',
              lineHeight: 1.2,
            }}
          >
            {when}
          </div>
        ) : null}
      </div>
      {/* Tier gems intentionally hidden in birdie haul rows. */}

      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          minWidth: 42,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: '#0F172A',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#94A3B8',
            lineHeight: 1,
          }}
        >
          {label}
        </div>
      </div>
    </button>
  );
}

export default FeatListRow;
