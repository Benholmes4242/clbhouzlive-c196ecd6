import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useHardestHoles,
  type HoleIndexMode,
  type HardestHoleRow,
  type HoleScoreDistribution,
} from '@/hooks/gam/useHardestHoles';
import { SectionHead } from './SectionHead';
import { DiscoverBand } from './DiscoverBand';
import { regionScopePhrase, matchesRegionScope } from './regionScope';
import { FONT } from './gamingLightTokens';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AMBER, INK, INK_MUTE, SLATE_50 } from '@/features/tourhub/_shared/tokens';
import { REGION_TABS } from './AlmanacSections';
import { getOptimizedImageUrl } from '@/utils/enhancedImageOptimization';
import { isEarlyData } from '@/lib/earlyData';

const RED = '#D2222D';
const GREEN = '#0F8F4A';
const INK_COLOR = '#0F172A';
const MUTE = 'rgba(15,23,42,0.45)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const MAX = 10;
const MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** Just the suffix, so the numeral can be set larger than the ordinal. */
function ordinalSuffix(n: number): string {
  return ordinal(n).replace(String(n), '');
}

const numFmt = (n: number | null | undefined, d = 1) =>
  n == null || Number.isNaN(Number(n)) ? '–' : Number(n).toFixed(d);

const signed = (n: number | null | undefined, d = 2) =>
  n == null || Number.isNaN(Number(n))
    ? '–'
    : `${Number(n) >= 0 ? '+' : ''}${Number(n).toFixed(d)}`;

function regionLabel(slug: string | null | undefined): string {
  return REGION_TABS.find((t) => t.slug === slug)?.label ?? 'Worldwide';
}

const isNum = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v);

/** Malformed or missing dist -> no histogram, rather than a crash. */
function safeDist(d: unknown): HoleScoreDistribution | null {
  if (!d || typeof d !== 'object') return null;
  const o = d as Record<string, unknown>;
  if (!isNum(o.birdie_plus) || !isNum(o.par) || !isNum(o.bogey) || !isNum(o.double_plus)) return null;
  return {
    birdie_plus: o.birdie_plus,
    par: o.par,
    bogey: o.bogey,
    double_plus: o.double_plus,
  };
}

const HIST_H = 54;
const BAR_MIN = 3;

function ScoreHistogram({ dist }: { dist: HoleScoreDistribution }) {
  const bars = [
    { key: 'bird', label: 'BIRD+', value: dist.birdie_plus, color: '#F7931E' },
    { key: 'par', label: 'PAR', value: dist.par, color: 'rgba(228,231,235,0.55)' },
    { key: 'bog', label: 'BOG', value: dist.bogey, color: '#8A93A3' },
    { key: 'dbl', label: 'DBL+', value: dist.double_plus, color: '#3C4657' },
  ];
  const peak = Math.max(0.01, ...bars.map((b) => (isNum(b.value) ? b.value : 0)));

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
      {bars.map((b) => {
        const v = isNum(b.value) ? b.value : 0;
        // Every bar keeps a 3px floor so a 0.0% value still reads as a bar.
        const h = Math.max(BAR_MIN, (v / peak) * HIST_H);
        return (
          <div key={b.key} style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.88)',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {numFmt(v, 1)}%
            </div>
            <div
              style={{
                height: HIST_H,
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: h,
                  background: b.color,
                  borderRadius: 2,
                }}
              />
            </div>
            <div
              style={{
                marginTop: 5,
                fontSize: 8.5,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {b.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Full-bleed hole card. The photograph is the COURSE, used as atmosphere
 * only - never presented as a picture of the hole. The club name is always
 * on the card so the attribution stays honest.
 */
function HoleCard({
  row,
  rankLabel,
  accent,
  mode,
  onTap,
}: {
  row: HardestHoleRow;
  rankLabel: string;
  accent: string;
  mode: HoleIndexMode;
  onTap: () => void;
}) {
  const dist = safeDist(row.dist);
  const img = row.course_image ? getOptimizedImageUrl(row.course_image, { width: 772 }) : '';
  const meta = [
    row.region,
    `par ${row.par}`,
    `plays ${numFmt(row.plays_to, 1)}`,
    `${row.rounds} rounds`,
  ]
    .filter(Boolean)
    .join(' \u00B7 ');

  return (
    <button
      type="button"
      onClick={onTap}
      className="active:opacity-95 transition-opacity"
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        aspectRatio: '16 / 12.5',
        borderRadius: 14,
        overflow: 'hidden',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: FONT,
        background: '#0E1216',
        backgroundImage: img
          ? undefined
          : 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: img ? undefined : '18px 18px',
      }}
    >
      {img ? (
        <img
          src={img}
          alt={row.course_name}
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : null}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,12,0.78)' }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 14,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span
            style={{
              background: accent,
              color: '#FFFFFF',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              borderRadius: 999,
              padding: '3px 8px',
            }}
          >
            {rankLabel}
          </span>
          {isEarlyData(row.rounds) ? (
            <span
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                borderRadius: 999,
                padding: '2px 6px',
              }}
            >
              Early data
            </span>
          ) : null}
        </div>

        {dist ? (
          <div style={{ marginBottom: 12 }}>
            <ScoreHistogram dist={dist} />
          </div>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 42,
                  fontWeight: 800,
                  letterSpacing: '-0.05em',
                  color: '#FFFFFF',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {row.hole_no}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
                {ordinalSuffix(row.hole_no)}
              </span>
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 14.5,
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {row.course_name}
            </div>
            <div
              className="tabular-nums"
              style={{
                marginTop: 3,
                fontSize: 10.5,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.58)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {meta}
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 29,
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {signed(row.avg_over, 2)}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {mode === 'easiest' ? 'To par' : 'Over par'}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export function HardestHolesRail({ region }: { region?: string | null } = {}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<HoleIndexMode>('hardest');
  const { data } = useHardestHoles(mode);
  const [sheetOpen, setSheetOpen] = useState(false);
  const railRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(
    () => (data ?? []).filter((h) => matchesRegionScope(region, h.country, h.region)),
    [data, region],
  );
  const rows = filtered.slice(0, MAX);
  const accent = mode === 'easiest' ? GREEN : RED;
  const scope = regionScopePhrase(region);
  const title = mode === 'easiest' ? `The easiest holes ${scope}` : `The toughest holes ${scope}`;

  // Active dot derived from scroll position, coalesced into one rAF tick.
  const onRailScroll = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = railRef.current;
      if (!el) return;
      const count = el.children.length;
      if (count === 0) return;
      const step = el.scrollWidth / count;
      const next = Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / step)));
      setActiveIndex((prev) => (prev === next ? prev : next));
    });
  }, []);

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  // Mode switch returns the rail to the first card.
  useEffect(() => {
    const el = railRef.current;
    if (el) el.scrollTo({ left: 0, behavior: 'auto' });
    setActiveIndex(0);
  }, [mode]);

  if (rows.length === 0) return null;

  return (
    <DiscoverBand marginTop={32}>
      <div style={{ padding: '12px 16px 0' }}>
        <SectionHead
          overline="Hole index"
          title={title}
          meta="View all"
          onMeta={() => setSheetOpen(true)}
          overlineColor={accent}
          paddingX={0}
          paddingBottom={10}
        />
        <div
          role="tablist"
          aria-label="Hole index mode"
          style={{
            display: 'inline-flex',
            gap: 2,
            padding: 2,
            background: '#FFFFFF',
            border: '1px solid rgba(15,23,42,0.08)',
            borderRadius: 999,
            marginTop: 2,
            marginBottom: 12,
          }}
        >
          {([
            { v: 'hardest', label: 'Toughest' },
            { v: 'easiest', label: 'Scoreable' },
          ] as const).map((o) => {
            const active = mode === o.v;
            return (
              <button
                key={o.v}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(o.v)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 999,
                  background: active ? '#15171F' : 'transparent',
                  color: active ? '#FFFFFF' : 'rgba(15,23,42,0.55)',
                  border: 'none',
                  fontFamily: FONT,
                  fontSize: 10.5,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={railRef}
        onScroll={onRailScroll}
        className="hole-index-rail"
        style={{
          display: 'flex',
          gap: 10,
          padding: '0 14px',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        <style>{'.hole-index-rail::-webkit-scrollbar{display:none}'}</style>
        {rows.map((h, i) => {
          const rankLabel =
            i === 0 ? (mode === 'easiest' ? 'No.1 scoreable' : 'No.1 toughest') : `No.${i + 1}`;
          return (
            <div
              key={`${h.course_id}-${h.hole_no}`}
              style={{ flex: '0 0 auto', width: 'min(92vw, 386px)', scrollSnapAlign: 'center' }}
            >
              <HoleCard
                row={h}
                rankLabel={rankLabel}
                accent={accent}
                mode={mode}
                onTap={() => navigate(`/courses/${h.course_id}`, { state: { activeTab: 'holes' } })}
              />
              {/* H2 contribution affordance - sits under the card, layout untouched */}
              <div style={{ marginTop: 8 }}>
                <AddHolePhotoRow courseId={h.course_id} holeNo={h.hole_no} surface="discover_card" />
              </div>
            </div>

          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
          padding: '10px 0 12px',
        }}
      >
        {rows.map((h, i) => (
          <span
            key={`${h.course_id}-${h.hole_no}-dot`}
            style={{
              width: i === activeIndex ? 18 : 5,
              height: 3,
              borderRadius: 2,
              background: i === activeIndex ? accent : 'rgba(15,23,42,0.16)',
              transition: 'width 0.18s ease, background 0.18s ease',
            }}
          />
        ))}
      </div>

      <HoleIndexSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        rows={filtered.slice(0, 30)}
        mode={mode}
        region={region ?? null}
        title={title}
      />
    </DiscoverBand>
  );
}

function HoleIndexSheet({
  open,
  onClose,
  rows,
  mode,
  region,
  title,
}: {
  open: boolean;
  onClose: () => void;
  rows: HardestHoleRow[];
  mode: HoleIndexMode;
  region: string | null;
  title: string;
}) {
  const navigate = useNavigate();
  const accent = mode === 'easiest' ? GREEN : RED;
  const total = rows.length;

  const handleRowTap = (courseId: string) => {
    onClose();
    setTimeout(() => {
      navigate(`/courses/${courseId}`, { state: { activeTab: 'holes' } });
    }, 60);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="hole-index-sheet-title"
      variant="light"
      surfaceColor={SLATE_50}
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        background: SLATE_50,
      }}
    >
      <div style={{ padding: '10px 16px 12px', background: SLATE_50 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: AMBER,
            marginBottom: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {regionLabel(region)} {'\u00B7'} WHS {'\u00B7'} {total} {total === 1 ? 'HOLE' : 'HOLES'}
        </div>
        <div
          id="hole-index-sheet-title"
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: SLATE_50,
          padding: '4px 0 24px',
        }}
      >
        {rows.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: INK_MUTE, fontSize: 12, fontWeight: 600 }}>
            None yet.
          </div>
        ) : (
          rows.map((h, i) => (
            <button
              key={`${h.course_id}-${h.hole_no}`}
              type="button"
              onClick={() => handleRowTap(h.course_id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: i === rows.length - 1 ? 'none' : `0.5px solid ${HAIRLINE}`,
                fontFamily: FONT,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                className="tabular-nums"
                style={{
                  flexShrink: 0,
                  width: 24,
                  fontSize: 13,
                  fontWeight: 700,
                  color: INK_MUTE,
                  letterSpacing: '-0.01em',
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: INK,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {ordinal(h.hole_no)} {'\u00B7'} {h.course_name}
                </div>
                <div
                  className="tabular-nums"
                  style={{
                    marginTop: 3,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: accent,
                    letterSpacing: '0.01em',
                  }}
                >
                  Par {h.par} · plays to {numFmt(h.plays_to, 1)}
                </div>
              </div>
              <div
                className="tabular-nums"
                style={{
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 600,
                  color: MUTE,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {h.rounds} rds
              </div>
            </button>
          ))
        )}
      </div>
    </BottomSheet>
  );
}

export default HardestHolesRail;
