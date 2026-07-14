import { useEffect, useMemo, useRef, useState } from 'react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import {
  AMBER,
  FONT,
  GOLD_DEEP,
  GOLD_BORDER,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SLATE_50,
  SURFACE,
} from '@/features/tourhub/_shared/tokens';
import { REGION_TABS } from './AlmanacSections';
import type { FeatRow, FeatTier } from './hooks/useRegionFeats';

const PAGE = 20;

const TIER_TITLE: Record<FeatTier, string> = {
  legendary: 'Aces & Albatrosses',
  records: 'Course records',
  eagles: 'Eagles',
  birdie_hauls: 'Birdie hauls',
};

const TIER_SHORT: Record<FeatTier, string> = {
  legendary: 'LEGENDARY',
  records: 'COURSE RECORDS',
  eagles: 'EAGLES',
  birdie_hauls: 'BIRDIE HAULS',
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
    setVisible(PAGE);
    setSort('latest');
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

  const top = sortedRows[0];
  const rest = sortedRows.slice(1, visible);
  const total = rows.length;
  const topHolder = top ? formatHolderName(top.holder_name) : '';
  const topValue = top ? humanizedValue(top, tier) : '';

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="tier-see-all-title"
      variant="light"
      surfaceColor={SLATE_50}
      style={{
        height: '90vh',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        background: SLATE_50,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 16px 12px',
          borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
          background: SLATE_50,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: AMBER,
              marginBottom: 4,
            }}
          >
            {TIER_SHORT[tier]}
          </div>
          <div
            id="tier-see-all-title"
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            {TIER_TITLE[tier]}
          </div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: INK_MUTE,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginTop: 3,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {regionLabel(region)} {'\u00B7'} WHS {'\u00B7'} {total} {total === 1 ? 'ENTRY' : 'ENTRIES'}
          </div>
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

        {/* No.1 masthead */}
        {top && (
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              background: SURFACE,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 3px rgba(255,184,0,0.10)',
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <SquircleAvatar
                size={52}
                src={top.holder_avatar}
                alt={topHolder}
                fallback={initials(topHolder)}
                hairlineRing
                ringColor={GOLD_DEEP}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 7.5,
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: GOLD_DEEP,
                  marginBottom: 3,
                }}
              >
                No.1 {'\u00B7'} {TIER_SHORT[tier]}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '-0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {topHolder}
              </div>
              {top.course_name && (
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: INK_MUTE,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {top.course_name}
                </div>
              )}
            </div>
            {topValue && (
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 200,
                  color: GOLD_DEEP,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                  flexShrink: 0,
                  textTransform: 'uppercase',
                }}
              >
                {topValue}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ledger 2..N */}
      <div
        ref={scrollerRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: SURFACE,
        }}
      >
        {rest.length === 0 ? (
          <div
            style={{
              padding: '28px 16px',
              textAlign: 'center',
              color: INK_MUTE,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            The champion stands alone. Be the first to challenge.
          </div>
        ) : (
          rest.map((row, i) => {
            const holder = formatHolderName(row.holder_name);
            const value = humanizedValue(row, tier);
            const when = relDate(row.play_date ?? row.attained_at ?? null);
            const rank = i + 2;
            return (
              <div
                key={`${row.score_id ?? row.course_id ?? i}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 16px',
                  borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
                  background: 'transparent',
                }}
              >
                <div
                  style={{
                    width: 28,
                    fontSize: 15,
                    fontWeight: 200,
                    color: INK,
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {rank}
                </div>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <SquircleAvatar
                    size={34}
                    src={row.holder_avatar}
                    alt={holder}
                    fallback={initials(holder)}
                    hairlineRing
                    ringColor={LIGHT_HAIRLINE}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: INK,
                      letterSpacing: '-0.01em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {holder}
                  </div>
                  {row.course_name && (
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 11.5,
                        fontWeight: 500,
                        color: INK_MUTE,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2,
                      }}
                    >
                      {row.course_name}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {value && (
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 200,
                        color: INK,
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1.1,
                      }}
                    >
                      {value}
                    </div>
                  )}
                  {when && (
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 10.5,
                        color: 'rgba(15,23,42,0.5)',
                        lineHeight: 1.1,
                      }}
                    >
                      {when}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {visible < sortedRows.length && (
          <div ref={sentinelRef} style={{ height: 40 }} />
        )}
        <div style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default TierSeeAllSheet;
