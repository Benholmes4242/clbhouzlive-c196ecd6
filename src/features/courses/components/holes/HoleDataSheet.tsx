/**
 * HoleDataSheet — "The Club Guide" (Holes tab v2).
 *
 * Full presentational replacement of the previous data-sheet build:
 * editorial header → skyline → story tiles →
 * "Hole by hole" list (By hole | Toughest first) with expandable card
 * distributions. No SQL/RPC changes.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { formatNumber } from '@/i18n/format';
import { HoleGlyph, HoleGlyphDefs, type HoleGlyphKind } from './HoleGlyph';
import { SC_FILL_BIRDIE } from './_constants';
import { fmtToPar } from '@/features/courses/_shared/holes/formatToPar';
import { ScoringBreakdownSection } from './ScoringBreakdownSection';
import { AddHolePhotoRow } from './AddHolePhotoRow';
import { HolePhotoGallery } from './HolePhotoGallery';
import { TITLE } from '@/lib/tokens/type';
import {
  A, Panel, Hairline, toParParts, LABEL as LABEL_A, NUM as NUM_A, KICKER as KICKER_A,
} from './analytical/tokens';

interface HookCell {
  key: string;
  label: string;
  value: string;
  tone?: string;
  note: string;
  /**
   * BRIEF_YOU_TAB_MARGIN_AND_GAPS s3: the battle row's sentence makes a
   * comparison ("better than most here") and never showed it. Two bars on ONE
   * scale draw it. The member's bar is SHORTER when they are better - these
   * are to-par averages, so a lower figure is the better one.
   */
  compare?: { youLabel: string; you: number; fieldLabel: string; field: number | null };
  /** The member's own progress (birdies collected). Amber - progress is amber. */
  progress?: { done: number; total: number };
}

/** The field's bar on a hook row. Neutral - the comparison, not a verdict. */
const FIELD_BAR_A = '#C6CFD8';

/**
 * One small bar of a two-bar comparison on a hook row, sharing its sibling's
 * scale. The member's bar is SHORTER when they are better: these are to-par
 * averages, so a lower figure is the better one. Do not invert it.
 */
const HookBar: React.FC<{
  label: string;
  value: number;
  scale: number;
  fill: string;
  figure: string;
}> = ({ label, value, scale, fill, figure }) => {
  const pct = scale > 0 ? Math.max(0, Math.min(100, (value / scale) * 100)) : 0;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '58px 1fr 38px',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 7.5,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: A.DIM,
        }}
      >
        {label}
      </span>
      <span style={{ display: 'block', height: 4, borderRadius: 2, background: A.TRACK }}>
        <span
          style={{ display: 'block', height: 4, borderRadius: 2, width: `${pct}%`, background: fill }}
        />
      </span>
      <span style={{ ...NUM_A, fontSize: 12, color: A.BODY, textAlign: 'right' }}>{figure}</span>
    </div>
  );
};


// ── Tokens ────────────────────────────────────────────────────────────
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const INK_06 = 'rgba(15,23,42,0.06)';
const INK_20 = 'rgba(15,23,42,0.20)';
const INK_35 = 'rgba(15,23,42,0.35)';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_85 = 'rgba(15,23,42,0.85)';
const GOLD = '#F7931E';
const GOLD_2 = '#FBBC2E';
const GOLD_INK = '#C97211';
const GOLD_TINT = 'rgba(247,147,30,0.10)';
const GOLD_GRAD_V = `linear-gradient(180deg, ${GOLD} 0%, ${GOLD_2} 100%)`;
const CARD_SHADOW = '0 1px 2px rgba(15,23,42,0.04)';
const NUM: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };

/**
 * Single source of truth for the score-distribution colours.
 * Used by the mix strip on every hole row and by the collapsed-state legend.
 */
export const DIST_SEG_COLORS = {
  eaglePlus: GOLD,
  birdie: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_2} 100%)`,
  par: INK_20,
  bogey: INK_55,
  double: INK_85,
} as const;


const CARD: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 20,
  boxShadow: CARD_SHADOW,
};

const STICKY_SAFE = 96;

// ── Helpers ───────────────────────────────────────────────────────────
function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
function ord(n: number): string {
  return `${n}${ordinalSuffix(n)}`;
}



function pctSum(row: CourseHole, keys: (keyof CourseHole['dist'])[]): number {
  return keys.reduce((s, k) => s + (row.dist[k] ?? 0), 0);
}

/**
 * Which slice of the sheet to render.
 * - 'all'   : legacy single-block render (header, skyline, tiles, hole table)
 * - 'shape' : course-level story only (header, skyline, community tiles)
 * - 'holes' : the hole-by-hole table only
 * - 'you'   : personal-only slice (scoring breakdown + personal tiles)
 */
export type HoleDataSection = 'all' | 'shape' | 'holes' | 'you';

interface Props {
  courseName: string;
  courseId?: string;
  holes: CourseHole[];
  totalRounds: number;
  myByHole: Map<number, MyHolePerformanceRow>;
  viewerHasPlayed: boolean;
  section?: HoleDataSection;
  /** 'holes' section only: render a Show/Hide affordance in the header. */
  collapsible?: boolean;
  /** 'holes' section only: start collapsed. */
  defaultCollapsed?: boolean;
  /** Fired the first time the collapsed hole table is opened. */
  onExpand?: () => void;
}

export const HoleDataSheet: React.FC<Props> = ({
  courseName,
  courseId,
  holes,
  totalRounds,
  myByHole,
  viewerHasPlayed,
  section = 'all',
  collapsible = false,
  defaultCollapsed = false,
  onExpand,
}) => {
  const { t } = useTranslation(['courses']);
  const [sort, setSort] = useState<'hole' | 'tough'>('hole');
  const [openHole, setOpenHole] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(collapsible && defaultCollapsed);

  const sortedByHole = useMemo(
    () => [...holes].sort((a, b) => a.hole_no - b.hole_no),
    [holes],
  );
  const sortedByTough = useMemo(
    () => [...holes].sort((a, b) => b.avg_to_par - a.avg_to_par),
    [holes],
  );

  const hardest = useMemo(
    () => holes.reduce<CourseHole | null>(
      (m, h) => (!m || h.avg_to_par > m.avg_to_par ? h : m),
      null,
    ),
    [holes],
  );
  const easiest = useMemo(
    () => holes.reduce<CourseHole | null>(
      (m, h) => (!m || h.avg_to_par < m.avg_to_par ? h : m),
      null,
    ),
    [holes],
  );

  const nemesis = useMemo(() => {
    if (!viewerHasPlayed) return null;
    const eligible = [...myByHole.values()].filter((r) => r.times_played >= 2);
    if (eligible.length === 0) return null;
    return eligible.reduce((m, r) => (r.avg_to_par > m.avg_to_par ? r : m), eligible[0]);
  }, [viewerHasPlayed, myByHole]);

  const birdiedHoles = useMemo(() => {
    const s = new Set<number>();
    if (!viewerHasPlayed) return s;
    myByHole.forEach((r) => {
      if (r.birdie_count > 0 || r.eagle_or_better_count > 0 || r.ace_count > 0) {
        s.add(r.hole_no);
      }
    });
    return s;
  }, [viewerHasPlayed, myByHole]);

  const birdiedCount = birdiedHoles.size;
  const totalHoles = holes.length;
  const missingBirdieHole = useMemo(() => {
    if (!viewerHasPlayed) return null;
    if (birdiedCount !== totalHoles - 1) return null;
    const missing = holes.find((h) => !birdiedHoles.has(h.hole_no));
    return missing?.hole_no ?? null;
  }, [viewerHasPlayed, birdiedCount, totalHoles, holes, birdiedHoles]);

  const beatFieldCount = useMemo(() => {
    if (!viewerHasPlayed) return 0;
    let n = 0;
    holes.forEach((h) => {
      const mine = myByHole.get(h.hole_no);
      if (mine && mine.avg_to_par <= h.avg_to_par + 0.005) n += 1;
    });
    return n;
  }, [viewerHasPlayed, holes, myByHole]);

  const rows = sort === 'hole' ? sortedByHole : sortedByTough;
  const toggle = (n: number) => setOpenHole((cur) => (cur === n ? null : n));

  const showShape = section === 'all' || section === 'shape';
  const showYou = section === 'all' || section === 'you';
  const showHoles = section === 'all' || section === 'holes';
  const tileScope: 'all' | 'community' | 'personal' =
    section === 'shape' ? 'community' : section === 'you' ? 'personal' : 'all';

  return (
    <div style={{ fontFamily: FONT, padding: '16px 12px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <HoleGlyphDefs />

      {/* 1. Header — the block header is owned by the page in the 'shape' slice. */}
      {showShape && (
      <section style={{ scrollMarginTop: STICKY_SAFE, padding: '0 4px' }}>
        {section !== 'shape' && (
          <h2
            style={{
              ...TITLE,
              margin: 0,
              color: INK,
            }}
          >
            {t('courses:holes.clubGuide.title')}
          </h2>
        )}
        <p style={{ margin: section === 'shape' ? 0 : '8px 0 0', fontSize: 12.5, color: INK_55, lineHeight: 1.5 }}>
          {viewerHasPlayed
            ? t('courses:holes.clubGuide.bodySignedIn', { count: totalRounds, rounds: formatNumber(totalRounds) })
            : t('courses:holes.clubGuide.bodySignedOut', { count: totalRounds, rounds: formatNumber(totalRounds) })}
        </p>
      </section>
      )}

      {/* 2 + 3. Skyline with the Beast / Best Chance callouts anchored beneath it */}
      {showShape && hardest && section === 'shape' && (
        <div style={{ ...CARD, padding: 16 }}>
          <SkylineCard
            holes={sortedByHole}
            hardest={hardest}
            myByHole={myByHole}
            viewerHasPlayed={viewerHasPlayed}
            beatFieldCount={beatFieldCount}
            embedded
            footer={
              <div style={{ marginTop: 12 }}>
                <StoryTiles
                  hardest={hardest}
                  easiest={easiest}
                  nemesis={nemesis}
                  holes={holes}
                  myByHole={myByHole}
                  viewerHasPlayed={viewerHasPlayed}
                  birdiedCount={birdiedCount}
                  totalHoles={totalHoles}
                  missingBirdieHole={missingBirdieHole}
                  scope="community"
                />
              </div>
            }
          />
        </div>
      )}

      {showShape && hardest && section !== 'shape' && (
        <SkylineCard
          holes={sortedByHole}
          hardest={hardest}
          myByHole={myByHole}
          viewerHasPlayed={viewerHasPlayed}
          beatFieldCount={beatFieldCount}
        />
      )}

      {/* The second and last kicker on the You tab. */}
      {section === 'you' && (
        <div style={{ ...KICKER_A, marginBottom: -8 }}>{t('courses:courseDetail.you.shotsGo')}</div>
      )}

      {/* 3. Story tiles */}
      {(showYou || (showShape && section !== 'shape')) && (
        <StoryTiles
          hardest={hardest}
          easiest={easiest}
          nemesis={nemesis}
          holes={holes}
          myByHole={myByHole}
          viewerHasPlayed={viewerHasPlayed}
          birdiedCount={birdiedCount}
          totalHoles={totalHoles}
          missingBirdieHole={missingBirdieHole}
          scope={tileScope}
        />
      )}


      {/* Scoring breakdown — renders nothing when RPC missing / <5 rounds / no WHS */}
      {showYou && <ScoringBreakdownSection golfCourseId={courseId} />}

      {/* 4. Hole by hole */}
      {showHoles && (
      <section style={{ scrollMarginTop: STICKY_SAFE, display: 'flex', flexDirection: 'column', gap: 8 }}>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '0 4px',
            gap: 8,
          }}
        >
          <div style={{ minWidth: 0 }}>
            {section !== 'holes' && (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: GOLD_INK,
                  }}
                >
                  {t('courses:holes.preview.eyebrow')}
                </div>
                <h3
                  style={{
                    margin: '4px 0 0',
                    fontSize: 17,
                    fontWeight: 700,
                    color: INK,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  {t('courses:holes.preview.title')}
                </h3>
                {/* The hole-by-hole narration is DELETED here too, with its keys:
                    the table's own columns already say what it said. */}

              </>
            )}
          </div>

          {!collapsed && (
          <div
            role="tablist"
            style={{
              display: 'inline-flex',
              background: '#FFFFFF',
              borderRadius: 999,
              padding: 3,
              boxShadow: CARD_SHADOW,
              flexShrink: 0,
            }}
          >
            {([
              ['hole', t('courses:holes.sortByHole')],
              ['tough', t('courses:holes.sortByDifficulty')],
            ] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={sort === v}
                onClick={() => setSort(v)}
                style={{
                  border: 0,
                  background: sort === v ? INK : 'transparent',
                  color: sort === v ? '#FFFFFF' : INK_55,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '6px 12px',
                  borderRadius: 999,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          )}
        </div>

        {/* Legend - colours read from DIST_SEG_COLORS, the same source the mix strip uses */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px', flexWrap: 'wrap' }}>
          {([
            [DIST_SEG_COLORS.birdie, t('courses:holes.preview.legendBirdie')],
            [DIST_SEG_COLORS.par, t('courses:holes.preview.legendPar')],
            [DIST_SEG_COLORS.bogey, t('courses:holes.preview.legendBogey')],
            [DIST_SEG_COLORS.double, t('courses:holes.preview.legendDouble')],
          ] as const).map(([bg, label]) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 8, borderRadius: 3, background: bg, display: 'inline-block' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: INK_55 }}>{label}</span>
            </span>
          ))}
        </div>

        {!collapsed && viewerHasPlayed && (
          <p style={{ margin: 0, padding: '0 4px', fontSize: 11.5, color: INK_55, lineHeight: 1.5 }}>
            {t('courses:holes.birdieRingNote')}
          </p>
        )}

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(collapsed ? sortedByHole.slice(0, 3) : rows).map((h) => (
            <HoleCard
              key={h.hole_no}
              row={h}
              mine={myByHole.get(h.hole_no) ?? null}
              isHardest={hardest?.hole_no === h.hole_no}
              isBirdied={birdiedHoles.has(h.hole_no)}
              open={!collapsed && openHole === h.hole_no}
              onToggle={() => toggle(h.hole_no)}
              viewerHasPlayed={viewerHasPlayed}
              courseId={courseId}
            />
          ))}
          {collapsed && sortedByHole.length >= 3 && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 80,
                pointerEvents: 'none',
                background: 'linear-gradient(180deg, rgba(248,250,252,0) 0%, rgba(248,250,252,0.92) 70%, #F8FAFC 100%)',
              }}
            />
          )}
        </div>

        {collapsible && (
          <button
            type="button"
            aria-expanded={!collapsed}
            onClick={() => {
              setCollapsed((c) => {
                if (c) onExpand?.();
                return !c;
              });
            }}
            style={{
              width: '100%',
              minHeight: 44,
              border: 0,
              borderRadius: 14,
              background: collapsed ? INK : '#F8FAFC',
              color: collapsed ? '#FFFFFF' : INK,
              fontSize: 13.5,
              fontWeight: 700,
              letterSpacing: '-0.005em',
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            {collapsed
              ? t('courses:holes.preview.seeAll', { count: totalHoles })
              : t('courses:holes.preview.showLess')}
          </button>
        )}

      </section>
      )}
    </div>

  );
};

// ──────────────────────────────────────────────────────────────────────
// Skyline
// ──────────────────────────────────────────────────────────────────────

const SkylineCard: React.FC<{
  holes: CourseHole[];
  hardest: CourseHole;
  myByHole: Map<number, MyHolePerformanceRow>;
  viewerHasPlayed: boolean;
  beatFieldCount: number;
  /** Rendered inside a shared container (chart + callouts) — drop own card chrome. */
  embedded?: boolean;
  /** Callouts anchored directly beneath the chart, inside the same container. */
  footer?: React.ReactNode;
}> = ({ holes, hardest, myByHole, viewerHasPlayed, beatFieldCount, embedded = false, footer }) => {

  const { t } = useTranslation(['courses']);
  const sorted = holes;
  const domainMax = Math.max(
    0.5,
    ...sorted.map((h) => h.avg_to_par),
    ...sorted.map((h) => myByHole.get(h.hole_no)?.avg_to_par ?? 0),
  );
  const domainMin = Math.min(
    0,
    ...sorted.map((h) => h.avg_to_par),
    ...sorted.map((h) => myByHole.get(h.hole_no)?.avg_to_par ?? 0),
  );
  const span = Math.max(0.5, domainMax - domainMin);

  const W = 340;
  const H = 130;
  const PX = 6;
  const PYT = 8;
  const PYB = 18;
  const chartW = W - PX * 2;
  const chartH = H - PYT - PYB;
  const stepX = chartW / sorted.length;
  const barW = stepX * 0.66;
  const rx = barW / 2.6;
  const yFor = (v: number) => PYT + chartH - ((v - domainMin) / span) * chartH;
  const yBaseline = yFor(0);
  const hasNegative = domainMin < 0;

  type Pt = { x: number; y: number };
  const segments: Pt[][] = [];
  if (viewerHasPlayed) {
    let seg: Pt[] = [];
    sorted.forEach((h, i) => {
      const cx = PX + stepX * i + stepX / 2;
      const mine = myByHole.get(h.hole_no);
      if (mine) {
        seg.push({ x: cx, y: yFor(mine.avg_to_par) });
      } else if (seg.length > 0) {
        segments.push(seg);
        seg = [];
      }
    });
    if (seg.length > 0) segments.push(seg);
  }



  return (
    <section style={embedded ? { scrollMarginTop: STICKY_SAFE } : { ...CARD, padding: 16, scrollMarginTop: STICKY_SAFE }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{t('courses:holes.shapeOfCourse')}</div>
        <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
          <LegendSwatch
            swatch={<span style={{ display: 'inline-block', width: 10, height: 6, background: INK_20, borderRadius: 2 }} />}
            label={t('courses:holes.legendEveryone')}
          />
          {viewerHasPlayed && (
            <LegendSwatch
              swatch={<span style={{ display: 'inline-block', width: 14, height: 2, background: GOLD, borderRadius: 2 }} />}
              label={t('courses:holes.legendYou')}
            />
          )}
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} aria-hidden>
          <defs>
            <linearGradient id="skyGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD_2} />
              <stop offset="100%" stopColor={GOLD} />
            </linearGradient>
          </defs>
          {hasNegative && (
            <line
              x1={PX}
              x2={W - PX}
              y1={yBaseline}
              y2={yBaseline}
              stroke={INK_20}
              strokeWidth={0.75}
              strokeDasharray="2 3"
            />
          )}
          {sorted.map((h, i) => {
            const isHardest = h.hole_no === hardest.hole_no;
            const cx = PX + stepX * i + stepX / 2;
            const yVal = yFor(h.avg_to_par);
            const isUnder = h.avg_to_par < 0;
            const yTop = Math.min(yVal, yBaseline);
            const yBot = Math.max(yVal, yBaseline);
            const barH = Math.max(2, yBot - yTop);
            const fill = isUnder ? GOLD : (isHardest ? INK : INK_20);
            return (
              <rect
                key={h.hole_no}
                x={cx - barW / 2}
                y={yTop}
                width={barW}
                height={barH}
                rx={rx}
                fill={fill}
              />
            );
          })}
          {sorted.map((h, i) => {
            const isHardest = h.hole_no === hardest.hole_no;
            const cx = PX + stepX * i + stepX / 2;
            return (
              <text
                key={h.hole_no}
                x={cx}
                y={H - 4}
                textAnchor="middle"
                fontSize={9}
                fontWeight={isHardest ? 700 : 600}
                fill={isHardest ? INK : INK_55}
                style={{ fontFamily: FONT }}
              >
                {h.hole_no}
              </text>
            );
          })}
          {segments.map((seg, idx) => (
            <g key={idx}>
              <polyline
                fill="none"
                stroke="url(#skyGold)"
                strokeWidth={2.3}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={seg.map((p) => `${p.x},${p.y}`).join(' ')}
              />
              {seg.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={2.1} fill={GOLD} />
              ))}
            </g>
          ))}
        </svg>
      </div>

      {footer}
    </section>

  );
};

const LegendSwatch: React.FC<{ swatch: React.ReactNode; label: string }> = ({ swatch, label }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.10em',
      color: INK_55,
      textTransform: 'uppercase',
    }}
  >
    {swatch}
    {label}
  </span>
);

// ──────────────────────────────────────────────────────────────────────
// Story tiles
// ──────────────────────────────────────────────────────────────────────

const StoryTiles: React.FC<{
  hardest: CourseHole | null;
  easiest: CourseHole | null;
  nemesis: MyHolePerformanceRow | null;
  holes: CourseHole[];
  myByHole: Map<number, MyHolePerformanceRow>;
  viewerHasPlayed: boolean;
  birdiedCount: number;
  totalHoles: number;
  missingBirdieHole: number | null;
  /** 'community' drops the personal tiles, 'personal' drops the field tiles. */
  scope?: 'all' | 'community' | 'personal';
}> = ({
  hardest, easiest, nemesis, holes, myByHole, viewerHasPlayed,
  birdiedCount, totalHoles, missingBirdieHole, scope = 'all',
}) => {
  const { t } = useTranslation(['courses']);
  const communityTiles: React.ReactNode[] = [];
  if (hardest) {
    const overPct = Math.round(pctSum(hardest, ['bogey', 'double']));
    communityTiles.push(
      <StoryTile
        key="beast"
        emoji="😤"
        cap="THE BEAST"
        headline={`Hole ${hardest.hole_no}`}
        sentence={`${overPct}% of the field walks off over par. Nobody escapes clean.`}
      />,
    );
  }
  if (easiest) {
    const underPar = easiest.avg_to_par < -0.005;
    const sentence = underPar
      ? `Plays to ${fmtToPar(easiest.avg_to_par)} — the field's happy place.`
      : "The friendliest hole on the card — the field's happy place.";
    communityTiles.push(
      <StoryTile
        key="best"
        emoji="🎯"
        cap="BEST CHANCE"
        headline={`Hole ${easiest.hole_no}`}
        sentence={sentence}
      />,
    );
  }

  if (scope === 'community') {
    if (communityTiles.length === 0) return null;
    return (
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, scrollMarginTop: STICKY_SAFE }}>
        {communityTiles}
      </section>
    );
  }

  if (!viewerHasPlayed || (scope === 'all' && communityTiles.length < 2)) {
    if (scope === 'personal') return null;
    return (
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, scrollMarginTop: STICKY_SAFE }}>
        {communityTiles}
      </section>
    );
  }

  // Personal scope (the You tab): one Panel, two full-width rows separated by a
  // hairline. No emoji - BRIEF_COURSE_YOU_TAB_ANALYTICAL_V2 s1. The sentences
  // and their noise-floor logic are untouched; only the container changed.
  if (scope === 'personal') {

    const hooks: HookCell[] = [];

    if (nemesis) {
      const fieldRow = holes.find((h) => h.hole_no === nemesis.hole_no);
      const fieldStr = fieldRow ? fmtToPar(fieldRow.avg_to_par) : fmtToPar(0);
      const youBeats = fieldRow ? nemesis.avg_to_par <= fieldRow.avg_to_par + 0.005 : false;
      const parts = toParParts(nemesis.avg_to_par, 2);
      hooks.push({
        key: 'battle',
        label: t('courses:courseDetail.you.yourBattle', { n: nemesis.hole_no }),
        value: parts?.text ?? '',
        // Shots lost - red, regardless of sign formatting.
        tone: A.RED,
        note: youBeats
          ? t('courses:holes.battle.youBeat')
          : t('courses:holes.battle.fieldBeats', { field: fieldStr }),
        // The FIELD average for THIS hole, taken from the hole row itself -
        // never derived from the course-wide field average, which is a
        // different number and would make the sentence false.
        compare: {
          youLabel: t('courses:courseDetail.you.youHere'),
          you: nemesis.avg_to_par,
          fieldLabel: t('courses:courseDetail.you.fieldOnHole'),
          field: fieldRow ? fieldRow.avg_to_par : null,
        },
      });
    }

    if (birdiedCount === totalHoles) {
      hooks.push({
        key: 'full',
        label: t('courses:courseDetail.you.fullHouse'),
        value: `${birdiedCount}/${totalHoles}`,
        note: "You've birdied every hole on this course.",
        progress: { done: birdiedCount, total: totalHoles },
      });
    } else if (birdiedCount === totalHoles - 1 && missingBirdieHole) {
      hooks.push({
        key: 'onetogo',
        label: t('courses:courseDetail.you.oneToGoHole', { n: missingBirdieHole }),
        value: `${birdiedCount}/${totalHoles}`,
        note: `Only the ${ord(missingBirdieHole)} has never given you a birdie.`,
        progress: { done: birdiedCount, total: totalHoles },
      });
    } else if (totalHoles > 0) {
      hooks.push({
        key: 'map',
        label: t('courses:courseDetail.you.birdieMap'),
        value: `${birdiedCount}/${totalHoles}`,
        note: `${totalHoles - birdiedCount} holes still waiting for your first birdie.`,
        progress: { done: birdiedCount, total: totalHoles },
      });
    }

    if (hooks.length === 0) return null;

    return (
      <Panel style={{ scrollMarginTop: STICKY_SAFE }}>
        {hooks.map((h, i) => (
          <React.Fragment key={h.key}>
            {i > 0 && <Hairline style={{ margin: '12px 0' }} />}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: A.DIM,
                  }}
                >
                  {h.label}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.45, color: A.BODY, marginTop: 5 }}>
                  {h.note}
                </div>
                {h.compare && (
                  <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                    <HookBar
                      label={h.compare.youLabel}
                      value={h.compare.you}
                      scale={
                        Math.max(h.compare.you, h.compare.field ?? h.compare.you, 0.05) * 1.08
                      }
                      fill={A.RED}
                      figure={fmtToPar(h.compare.you)}
                    />
                    {h.compare.field != null && (
                      <HookBar
                        label={h.compare.fieldLabel}
                        value={h.compare.field}
                        scale={Math.max(h.compare.you, h.compare.field, 0.05) * 1.08}
                        fill={FIELD_BAR_A}
                        figure={fmtToPar(h.compare.field)}
                      />
                    )}
                  </div>
                )}
                {h.progress && (
                  <span
                    style={{
                      display: 'block',
                      width: 54,
                      height: 4,
                      borderRadius: 2,
                      background: A.TRACK,
                      marginTop: 8,
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        height: 4,
                        borderRadius: 2,
                        width: `${Math.max(
                          0,
                          Math.min(100, (h.progress.done / Math.max(1, h.progress.total)) * 100),
                        )}%`,
                        background: A.AMBER,
                      }}
                    />
                  </span>
                )}
              </div>
              <div style={{ ...NUM_A, fontSize: 20, color: h.tone ?? A.INK, whiteSpace: 'nowrap' }}>
                {h.value}
              </div>
            </div>
          </React.Fragment>
        ))}
      </Panel>

    );
  }


  const tiles: React.ReactNode[] = [...communityTiles];




  // Your battle
  if (nemesis) {
    const fieldRow = holes.find((h) => h.hole_no === nemesis.hole_no);
    const youStr = fmtToPar(nemesis.avg_to_par);
    const fieldStr = fieldRow ? fmtToPar(fieldRow.avg_to_par) : fmtToPar(0);
    const youBeats = fieldRow ? nemesis.avg_to_par <= fieldRow.avg_to_par + 0.005 : false;
    const sentence = youBeats
      ? t('courses:holes.battle.tileYouBeat', { you: youStr })
      : t('courses:holes.battle.tileFieldBeats', { you: youStr, field: fieldStr });
    tiles.push(
      <StoryTile
        key="battle"
        emoji="🥊"
        cap="YOUR BATTLE"
        headline={`Hole ${nemesis.hole_no}`}
        sentence={sentence}
        personal
      />,
    );
  }

  // Birdie map / One to go / Full house
  if (birdiedCount === totalHoles) {
    tiles.push(
      <StoryTile
        key="full"
        emoji="🏆"
        cap="FULL HOUSE"
        headline={`${totalHoles} of ${totalHoles} birdied`}
        sentence="You've birdied every hole on this course."
        personal
      />,
    );
  } else if (birdiedCount === totalHoles - 1 && missingBirdieHole) {
    tiles.push(
      <StoryTile
        key="onetogo"
        emoji="⛳"
        cap="ONE TO GO"
        headline={`${birdiedCount} of ${totalHoles} birdied`}
        sentence={`Only the ${ord(missingBirdieHole)} has never given you a birdie. The quest is on.`}
        personal
      />,
    );
  } else {
    tiles.push(
      <StoryTile
        key="map"
        emoji="⛳"
        cap="BIRDIE MAP"
        headline={`${birdiedCount} of ${totalHoles} birdied`}
        sentence={`${totalHoles - birdiedCount} holes still waiting for your first birdie.`}
        personal
      />,
    );
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, scrollMarginTop: STICKY_SAFE }}>
      {tiles}
    </section>
  );
};

const StoryTile: React.FC<{
  emoji: string;
  cap: string;
  headline: string;
  sentence: string;
  personal?: boolean;
}> = ({ emoji, cap, headline, sentence, personal }) => (
  <div
    style={{
      borderRadius: 18,
      padding: '12px 14px',
      background: personal ? GOLD_TINT : INK_06,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minHeight: 116,
    }}
  >
    <div style={{ fontSize: 16, lineHeight: 1 }} aria-hidden>{emoji}</div>
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: INK_55,
        textTransform: 'uppercase',
      }}
    >
      {cap}
    </div>
    <div
      style={{
        fontSize: 16.5,
        fontWeight: 700,
        color: personal ? GOLD_INK : INK,
        letterSpacing: '-0.005em',
        lineHeight: 1.15,
      }}
    >
      {headline}
    </div>
    <div style={{ fontSize: 10.5, color: INK_55, lineHeight: 1.45, marginTop: 2 }}>
      {sentence}
    </div>
  </div>
);


// ──────────────────────────────────────────────────────────────────────
// Mix strip (community distribution, per hole card)
// ──────────────────────────────────────────────────────────────────────

const MixStrip: React.FC<{ row: CourseHole }> = ({ row }) => {
  const segs = [
    { pct: pctSum(row, ['ace', 'albatross', 'eagle']), bg: DIST_SEG_COLORS.eaglePlus },
    { pct: row.dist.birdie ?? 0, bg: DIST_SEG_COLORS.birdie },
    { pct: row.dist.par ?? 0, bg: DIST_SEG_COLORS.par },
    { pct: row.dist.bogey ?? 0, bg: DIST_SEG_COLORS.bogey },
    { pct: row.dist.double ?? 0, bg: DIST_SEG_COLORS.double },
  ];

  const total = Math.max(0.01, segs.reduce((s, x) => s + x.pct, 0));
  return (
    <div style={{ height: 5, background: INK_06, borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
      {segs.map((s, i) => (
        <div key={i} style={{ width: `${(s.pct / total) * 100}%`, height: '100%', background: s.bg }} />
      ))}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Hole card
// ──────────────────────────────────────────────────────────────────────

const HoleCard: React.FC<{
  row: CourseHole;
  mine: MyHolePerformanceRow | null;
  isHardest: boolean;
  isBirdied: boolean;
  open: boolean;
  onToggle: () => void;
  viewerHasPlayed: boolean;
  courseId?: string;
}> = ({ row, mine, isHardest, isBirdied, open, onToggle, viewerHasPlayed, courseId }) => {
  const { t } = useTranslation(['courses']);
  const fieldOver = row.avg_to_par;
  const showYou = viewerHasPlayed && mine != null;
  const youBeats = showYou ? (mine!.avg_to_par <= fieldOver + 0.005) : false;

  return (
    <div
      style={{ ...CARD, overflow: 'hidden' }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
        }}
        style={{
          display: 'grid',
          gridTemplateColumns: '42px 1fr auto',
          gap: 12,
          alignItems: 'center',
          padding: '11px 14px',
          cursor: 'pointer',
        }}
      >
        {/* Squircle */}
        <div style={{ position: 'relative', width: 42, height: 42 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: isHardest ? INK : INK_06,
              color: isHardest ? '#FFFFFF' : INK,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              ...NUM,
            }}
          >
            {row.hole_no}
          </div>
          {isBirdied && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 15,
                height: 15,
                borderRadius: 999,
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: CARD_SHADOW,
              }}
            >
              {/* Pill grammar: a birdie is a SOLID RED disc. Gold is rarity only. */}
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 999,
                  background: SC_FILL_BIRDIE,
                }}
              />
            </div>
          )}
        </div>

        {/* Middle */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 11.5, color: INK_55, ...NUM }}>
            {t('courses:holes.parAndSi', { par: row.par, si: row.stroke_index ?? '\u2014' })}
            {isHardest && (
              <span style={{ color: GOLD_INK, fontWeight: 700 }}>{t('courses:holes.theBeastSuffix')}</span>
            )}
          </div>
          <MixStrip row={row} />
        </div>

        {/* Right */}
        <div style={{ textAlign: 'right', minWidth: 60 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: INK,
              ...NUM,
              lineHeight: 1,
            }}
          >
            {fmtToPar(fieldOver)}
          </div>
          {showYou && (
            <div
              style={{
                fontSize: 9.5,
                color: youBeats ? GOLD_INK : INK_85,
                marginTop: 3,
                ...NUM,
              }}
            >
              {t('courses:holes.youAvg', { avg: fmtToPar(mine!.avg_to_par) })}
            </div>
          )}
        </div>
      </div>

      {open && <ExpandedCard row={row} mine={mine} viewerHasPlayed={viewerHasPlayed} courseId={courseId} />}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Expanded card
// ──────────────────────────────────────────────────────────────────────

const ExpandedCard: React.FC<{
  row: CourseHole;
  mine: MyHolePerformanceRow | null;
  viewerHasPlayed: boolean;
  courseId?: string;
}> = ({ row, mine, viewerHasPlayed, courseId }) => {
  const parOrBetterPct = Math.round(pctSum(row, ['ace', 'albatross', 'eagle', 'birdie', 'par']));
  const overPct = pctSum(row, ['bogey', 'double']);
  const bogeyDescriptor = overPct >= 70
    ? 'most take bogey or worse'
    : 'the rest split between bogey and better';

  const you = mine ? mine.avg_to_par : null;
  const diff = you != null ? you - row.avg_to_par : null;
  const youBeats = diff != null && diff <= 0.005;

  let sentence = `Only ${parOrBetterPct}% of rounds here finish at par or better \u2014 ${bogeyDescriptor}.`;
  if (viewerHasPlayed && mine != null && diff != null) {
    const magnitude = Math.abs(diff).toFixed(2);
    sentence += youBeats
      ? ` You beat the field by ${magnitude} on it.`
      : ` You trail the field by ${magnitude} on it.`;
  }

  const bars: { kind: HoleGlyphKind; label: string; pct: number; gold: boolean; fill: string }[] = [
    { kind: 'eagle-or-better', label: 'EAG+', pct: pctSum(row, ['ace', 'albatross', 'eagle']), gold: true, fill: GOLD },
    { kind: 'birdie', label: 'BIRD', pct: row.dist.birdie ?? 0, gold: true, fill: GOLD_GRAD_V },
    { kind: 'par', label: 'PAR', pct: row.dist.par ?? 0, gold: false, fill: INK_20 },
    { kind: 'bogey', label: 'BOG', pct: row.dist.bogey ?? 0, gold: false, fill: INK_55 },
    { kind: 'double-plus', label: 'DBL+', pct: row.dist.double ?? 0, gold: false, fill: INK_85 },
  ];
  const maxPct = Math.max(1, ...bars.map((b) => b.pct));
  const CHART_H = 88;
  const LABEL_GAP = 14; // min gap from sentence to tallest label

  return (
    <div style={{ padding: '0 14px 14px' }}>
      <div style={{ height: 1, background: INK_06, marginTop: 0, marginBottom: 12 }} />

      <div style={{ marginBottom: 12 }}>
        <HolePhotoGallery courseId={courseId} holeNo={row.hole_no} />
        <div style={{ marginTop: 10 }}>
          <AddHolePhotoRow courseId={courseId} holeNo={row.hole_no} surface="hole_sheet" />
        </div>
      </div>




      <div style={{ fontSize: 11.5, color: INK_55, lineHeight: 1.5, marginBottom: LABEL_GAP }}>
        {sentence}
      </div>

      {/* Distribution chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, alignItems: 'end' }}>
        {bars.map((b) => {
          const zero = b.pct < 0.5;
          const h = zero ? 3 : Math.max(6, (b.pct / maxPct) * CHART_H);
          return (
            <div key={b.kind} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: b.gold ? GOLD_INK : INK,
                  ...NUM,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {zero ? '0%' : `${Math.round(b.pct)}%`}
              </div>
              <div
                style={{
                  width: '100%',
                  height: CHART_H,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                }}
              >
                {zero ? (
                  <div
                    style={{
                      width: '78%',
                      height: 3,
                      background: INK_06,
                      borderRadius: 999,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '78%',
                      height: h,
                      background: b.fill,
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      borderBottomLeftRadius: 2,
                      borderBottomRightRadius: 2,
                    }}
                  />
                )}
              </div>
              <div style={{ height: 1, background: INK_06, width: '100%', marginTop: 2 }} />
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  color: INK_55,
                  marginTop: 3,
                }}
              >
                {b.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HoleDataSheet;
