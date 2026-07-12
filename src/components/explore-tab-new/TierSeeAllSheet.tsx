import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { INK, INK_MUTE, HAIRLINE_INK_8, INK_TINT_06 } from '@/features/courses/_shared/tokens';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { Z } from '@/config/zIndex';
import { TIER_ICON, REGION_TABS } from './AlmanacSections';
import type { FeatRow, FeatTier } from './hooks/useRegionFeats';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const PAGE = 20;

const TIER_TITLE: Record<FeatTier, string> = {
  legendary: 'Aces & Albatrosses',
  records: 'Course records',
  eagles: 'Eagles',
  birdie_hauls: 'Birdie hauls',
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

function humanizedValue(row: FeatRow, tier: FeatTier): string {
  if (tier !== 'records') return row.feat_value ?? '';
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
    default:
      return String(row.value);
  }
}

function regionLabel(slug: string | null): string {
  return REGION_TABS.find((t) => t.slug === slug)?.label ?? 'Worldwide';
}

interface Props {
  open: boolean;
  onClose: () => void;
  tier: FeatTier;
  region: string | null;
  rows: FeatRow[];
}

type SortMode = 'latest' | 'top';

const ASC_CATEGORIES = new Set([
  'lowest_gross_all_time',
  'lowest_gross_90d',
  'best_score_diff_all_time',
  'best_score_diff_90d',
]);

function isAscending(category?: string | null): boolean {
  return !!category && ASC_CATEGORIES.has(category);
}

function parseLeadingInt(s?: string | null): number {
  if (!s) return 0;
  const m = String(s).match(/-?\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function tsOf(row: FeatRow): number {
  const iso = row.play_date ?? row.attained_at;
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function TierSeeAllSheet({ open, onClose, tier, region, rows }: Props) {
  const [visible, setVisible] = useState(PAGE);
  const [sort, setSort] = useState<SortMode>('latest');
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const hasToggle = tier === 'birdie_hauls' || tier === 'records';

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    setVisible(PAGE);
    setSort('latest');
    return () => {
      unlockBodyScroll();
    };
  }, [open]);

  const sortedRows = useMemo(() => {
    if (sort === 'latest' || !hasToggle) return rows;
    const arr = rows.slice();
    if (tier === 'birdie_hauls') {
      arr.sort((a, b) => {
        const va = parseLeadingInt(a.feat_value);
        const vb = parseLeadingInt(b.feat_value);
        if (vb !== va) return vb - va;
        return tsOf(b) - tsOf(a);
      });
    } else if (tier === 'records') {
      arr.sort((a, b) => {
        const va = Number(a.value ?? 0);
        const vb = Number(b.value ?? 0);
        const ka = isAscending(a.category) ? va : -va;
        const kb = isAscending(b.category) ? vb : -vb;
        if (ka !== kb) return ka - kb;
        return tsOf(b) - tsOf(a);
      });
    }
    return arr;
  }, [rows, sort, tier, hasToggle]);

  useEffect(() => {
    if (!open) return;
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + PAGE, sortedRows.length));
        }
      },
      { root: scrollerRef.current, rootMargin: '200px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [open, sortedRows.length]);

  useEffect(() => {
    setVisible(PAGE);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [sort]);

  const recentLabel = useMemo(() => {
    const thirtyAgo = Date.now() - 30 * 86400000;
    const oldest = rows.reduce<number>((min, r) => {
      const iso = r.play_date ?? r.attained_at;
      if (!iso) return min;
      const t = new Date(iso).getTime();
      return Number.isFinite(t) ? Math.min(min, t) : min;
    }, Number.POSITIVE_INFINITY);
    if (!Number.isFinite(oldest)) return 'Recent · verified WHS rounds';
    return oldest >= thirtyAgo
      ? 'Last 30 days · verified WHS rounds'
      : 'Recent · verified WHS rounds';
  }, [rows]);

  if (!open) return null;

  const shown = sortedRows.slice(0, visible);
  const showRanks = hasToggle && sort === 'top';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.sheet,
        display: 'flex',
        alignItems: 'flex-end',
        background: 'rgba(15,17,23,0.5)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          height: '86dvh',
          background: '#F8FAFC',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -8px 24px rgba(15,17,23,0.18)',
          fontFamily: FONT,
        }}
      >
        {/* Grab handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.14)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 16px 12px', borderBottom: `0.5px solid ${HAIRLINE_INK_8}`, background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden style={{ fontSize: 15, lineHeight: 1 }}>{TIER_ICON[tier]}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: INK,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {TIER_TITLE[tier]} · {regionLabel(region)}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 999,
                background: 'rgba(15,23,42,0.06)',
                color: INK,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {rows.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'transparent', border: 0, padding: 4, cursor: 'pointer', color: INK }}
            >
              <X size={20} />
            </button>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(15,23,42,0.5)' }}>
            {recentLabel}
          </div>
          {hasToggle && (
            <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
              {(['latest', 'top'] as const).map((mode) => {
                const active = sort === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSort(mode)}
                    style={{
                      appearance: 'none',
                      border: 0,
                      padding: '5px 12px',
                      borderRadius: 999,
                      fontFamily: FONT,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      cursor: 'pointer',
                      background: active ? INK : 'transparent',
                      color: active ? '#FFFFFF' : 'rgba(15,23,42,0.55)',
                    }}
                  >
                    {mode === 'latest' ? 'Latest' : 'Top'}
                  </button>
                );
              })}
            </div>
          )}
        </div>


        {/* List */}
        <div
          ref={scrollerRef}
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          {shown.map((row, i) => {
            const holder = formatHolderName(row.holder_name);
            const value = humanizedValue(row, tier);
            const when = relDate(row.play_date ?? row.attained_at ?? null);
            return (
              <div
                key={`${row.score_id ?? row.course_id ?? i}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: `0.5px solid ${HAIRLINE_INK_8}`,
                  background: '#FFFFFF',
                }}
              >
                {showRanks && (
                  <div
                    style={{
                      width: 20,
                      flexShrink: 0,
                      textAlign: 'right',
                      fontSize: 12,
                      fontVariantNumeric: 'tabular-nums',
                      color: 'rgba(15,23,42,0.35)',
                    }}
                  >
                    {i + 1}
                  </div>
                )}
                <SquircleAvatar
                  size={36}
                  src={row.holder_avatar}
                  alt={holder}
                  fallback={initials(holder)}
                  thinRing
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: INK,
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
                      fontSize: 12.5,
                      color: INK_MUTE,
                      lineHeight: 1.25,
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.course_name}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: INK,
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.2,
                    }}
                  >
                    {value}
                  </div>
                  {when && (
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 11,
                        color: 'rgba(15,23,42,0.5)',
                        lineHeight: 1.2,
                      }}
                    >
                      {when}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {visible < rows.length && (
            <div ref={sentinelRef} style={{ height: 40, background: INK_TINT_06, opacity: 0 }} />
          )}
          <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default TierSeeAllSheet;
