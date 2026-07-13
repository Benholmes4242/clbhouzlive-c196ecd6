import { useMemo } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { FeatRow, FeatTier } from './hooks/useRegionFeats';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

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
}

export function FeatListRow({ row, onTap }: Props) {
  const holder = useMemo(() => formatHolderName(row.holder_name), [row.holder_name]);
  const value = (row.feat_value ?? (row.value != null ? String(row.value) : '')).toUpperCase();
  const when = relDate(row.play_date ?? row.attained_at ?? null);

  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full text-left active:scale-[0.995] transition-transform"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 12,
        padding: '10px 12px',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
        marginBottom: 8,
        border: 'none',
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <SquircleAvatar
          size={26}
          src={row.holder_avatar}
          alt={holder}
          fallback={initials(holder)}
          hairlineRing
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontWeight: 800, color: '#0F172A' }}>{value}</span>
          {value ? <span style={{ color: '#94A3B8', fontWeight: 600 }}> · </span> : null}
          <span style={{ fontWeight: 600, color: '#64748B' }}>{row.course_name}</span>
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 11,
            color: '#94A3B8',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {holder}
          {when ? ` · ${when}` : ''}
        </div>
      </div>
      <span
        aria-hidden
        style={{
          fontSize: 14,
          color: '#CBD5E1',
          fontWeight: 600,
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ›
      </span>
    </button>
  );
}

export default FeatListRow;
