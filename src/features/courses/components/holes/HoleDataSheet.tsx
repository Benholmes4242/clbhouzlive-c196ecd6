/**
 * HoleDataSheet — the signed-off "Hole Data Sheet" surface for the
 * course details Holes tab. Rebuilds the entire tab presentationally
 * around one editorial sheet: header → difficulty skyline → stat
 * ledger → notation key → OUT/IN scorecard tables → expanded row
 * detail. Data comes from the existing community + viewer RPCs, no
 * schema changes.
 */
import React, { useMemo, useState } from 'react';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { HoleGlyph, HoleGlyphDefs, type HoleGlyphKind } from './HoleGlyph';

// ── Tokens (scorecard language) ──────────────────────────────────────
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0F172A';
const INK_08 = 'rgba(15,23,42,0.08)';
const INK_20 = 'rgba(15,23,42,0.20)';
const INK_35 = 'rgba(15,23,42,0.35)';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_85 = 'rgba(15,23,42,0.85)';
const GOLD = '#F7931E';
const GOLD_INK = '#C97211';
const GOLD_GRAD = 'linear-gradient(180deg, #F7931E 0%, #FBBC2E 100%)';
const GOLD_GRAD_H = 'linear-gradient(90deg, #F7931E 0%, #FBBC2E 100%)';
const NUM: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };
const CAP: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: INK_55,
};
const SECTION_RULE: React.CSSProperties = {
  borderTop: `1px solid ${INK_08}`,
};

// ── Helpers ──────────────────────────────────────────────────────────
function fmtSigned(v: number, dp = 2): string {
  if (Math.abs(v) < 0.005) return dp === 1 ? '±0.0' : '±0.00';
  if (v > 0) return `+${v.toFixed(dp)}`;
  return `\u2212${Math.abs(v).toFixed(dp)}`;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function pctOf(row: CourseHole, keys: (keyof CourseHole['dist'])[]): number {
  return keys.reduce((acc, k) => acc + (row.dist[k] ?? 0), 0);
}

interface Props {
  courseName: string;
  holes: CourseHole[];
  totalRounds: number;
  myByHole: Map<number, MyHolePerformanceRow>;
  viewerHasPlayed: boolean;
}

export const HoleDataSheet: React.FC<Props> = ({
  courseName,
  holes,
  totalRounds,
  myByHole,
  viewerHasPlayed,
}) => {
  const [sort, setSort] = useState<'hole' | 'difficulty'>('hole');
  const [openHole, setOpenHole] = useState<number | null>(null);

  const parTotal = useMemo(() => holes.reduce((s, h) => s + h.par, 0), [holes]);

  const hardest = useMemo(
    () => holes.reduce<CourseHole | null>((m, h) => (!m || h.avg_to_par > m.avg_to_par ? h : m), null),
    [holes],
  );
  const scoreable = useMemo(
    () => holes.reduce<CourseHole | null>((m, h) => (!m || h.avg_to_par < m.avg_to_par ? h : m), null),
    [holes],
  );

  const nemesis = useMemo(() => {
    if (!viewerHasPlayed) return null;
    const eligible = [...myByHole.values()].filter((r) => r.times_played >= 2);
    if (eligible.length === 0) return null;
    return eligible.reduce((m, r) => (r.avg_to_par > m.avg_to_par ? r : m), eligible[0]);
  }, [viewerHasPlayed, myByHole]);

  const birdiedHoles = useMemo(() => {
    if (!viewerHasPlayed) return new Set<number>();
    const s = new Set<number>();
    myByHole.forEach((r) => {
      if (r.birdie_count > 0 || r.eagle_or_better_count > 0 || r.ace_count > 0) {
        s.add(r.hole_no);
      }
    });
    return s;
  }, [viewerHasPlayed, myByHole]);

  const birdiedCount = birdiedHoles.size;
  const missingBirdieHole = useMemo(() => {
    if (birdiedCount !== holes.length - 1) return null;
    const missing = holes.find((h) => !birdiedHoles.has(h.hole_no));
    return missing?.hole_no ?? null;
  }, [birdiedCount, holes, birdiedHoles]);

  const beatFieldCount = useMemo(() => {
    if (!viewerHasPlayed) return 0;
    let n = 0;
    holes.forEach((h) => {
      const mine = myByHole.get(h.hole_no);
      if (mine && mine.avg_to_par <= h.avg_to_par + 0.005) n += 1;
    });
    return n;
  }, [viewerHasPlayed, holes, myByHole]);

  const out = useMemo(() => holes.filter((h) => h.hole_no <= 9).sort((a, b) => a.hole_no - b.hole_no), [holes]);
  const inN = useMemo(() => holes.filter((h) => h.hole_no > 9).sort((a, b) => a.hole_no - b.hole_no), [holes]);
  const combinedByDifficulty = useMemo(
    () => [...holes].sort((a, b) => b.avg_to_par - a.avg_to_par),
    [holes],
  );

  const toggle = (n: number) => setOpenHole((cur) => (cur === n ? null : n));

  return (
    <div style={{ background: 'transparent', fontFamily: FONT, padding: '16px 12px 24px' }}>
      <HoleGlyphDefs />

      {/* 1. Header */}
      <div style={{ padding: '0 4px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: INK,
            }}
          >
            Hole data sheet
          </h2>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: INK_55, ...NUM }}>
            PAR {parTotal} · {totalRounds.toLocaleString()} RDS
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          {['OFFICIAL WHS', courseName?.toUpperCase() || '—'].map((label) => (
            <span
              key={label}
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.10em',
                color: INK_55,
              }}
            >
              {label}
            </span>
          ))}
        </div>

      </div>

      {/* 2. Skyline */}
      <SkylineCard
        holes={holes}
        hardest={hardest}
        myByHole={myByHole}
        viewerHasPlayed={viewerHasPlayed}
        beatFieldCount={beatFieldCount}
      />

      {/* 3. Ledger */}
      <LedgerCard
        hardest={hardest}
        scoreable={scoreable}
        nemesis={nemesis}
        holes={holes}
        viewerHasPlayed={viewerHasPlayed}
        birdiedCount={birdiedCount}
        totalHoles={holes.length}
        missingBirdieHole={missingBirdieHole}
      />

      {/* 4. Notation key */}
      <NotationKey viewerHasPlayed={viewerHasPlayed} />

      {/* 5. Sort toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 4px 10px',
        }}
      >
        <div style={CAP}>Scorecard</div>
        <div
          role="tablist"
          style={{
            display: 'inline-flex',
            background: '#FFFFFF',
            border: `1px solid ${INK_08}`,
            borderRadius: 999,
            padding: 2,
          }}
        >
          {(['hole', 'difficulty'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={sort === v}
              onClick={() => setSort(v)}
              style={{
                border: 0,
                background: sort === v ? INK : 'transparent',
                color: sort === v ? '#FFFFFF' : INK_55,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                padding: '6px 12px',
                borderRadius: 999,
                cursor: 'pointer',
              }}
            >
              {v === 'hole' ? 'By hole' : 'By difficulty'}
            </button>
          ))}
        </div>
      </div>

      {sort === 'hole' ? (
        <>
          <ScorecardTable
            label="OUT"
            rows={out}
            myByHole={myByHole}
            viewerHasPlayed={viewerHasPlayed}
            birdiedHoles={birdiedHoles}
            openHole={openHole}
            onToggle={toggle}
            showTotals
          />
          <div style={{ height: 12 }} />
          <ScorecardTable
            label="IN"
            rows={inN}
            myByHole={myByHole}
            viewerHasPlayed={viewerHasPlayed}
            birdiedHoles={birdiedHoles}
            openHole={openHole}
            onToggle={toggle}
            showTotals
          />
        </>
      ) : (
        <ScorecardTable
          label="ALL"
          rows={combinedByDifficulty}
          myByHole={myByHole}
          viewerHasPlayed={viewerHasPlayed}
          birdiedHoles={birdiedHoles}
          openHole={openHole}
          onToggle={toggle}
          showTotals={false}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Skyline
// ──────────────────────────────────────────────────────────────────────

const SkylineCard: React.FC<{
  holes: CourseHole[];
  hardest: CourseHole | null;
  myByHole: Map<number, MyHolePerformanceRow>;
  viewerHasPlayed: boolean;
  beatFieldCount: number;
}> = ({ holes, hardest, myByHole, viewerHasPlayed, beatFieldCount }) => {
  const sorted = useMemo(() => [...holes].sort((a, b) => a.hole_no - b.hole_no), [holes]);
  const maxAvg = Math.max(0.1, ...sorted.map((h) => h.avg_to_par));
  const minAvg = Math.min(0, ...sorted.map((h) => (myByHole.get(h.hole_no)?.avg_to_par ?? 0)));
  const domainMax = Math.max(maxAvg, ...sorted.map((h) => myByHole.get(h.hole_no)?.avg_to_par ?? 0));
  const domainMin = Math.min(0, minAvg);
  const span = Math.max(0.5, domainMax - domainMin);

  const W = 340;
  const H = 120;
  const PX = 8;
  const PY = 10;
  const chartW = W - PX * 2;
  const chartH = H - PY * 2;
  const barW = (chartW / sorted.length) * 0.72;
  const stepX = chartW / sorted.length;
  const yFor = (v: number) => PY + chartH - ((v - domainMin) / span) * chartH;
  const yBaseline = yFor(0);

  // Build polyline segments (break across missing)
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
    <div style={{ ...SECTION_RULE, padding: '20px 4px 4px', marginTop: 12 }}>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={CAP}>Difficulty profile</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: INK_55, marginTop: 2 }}>
            How many shots over par each hole costs, on average
          </div>
        </div>
        {viewerHasPlayed && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Legend swatch={<span style={{ display: 'inline-block', width: 10, height: 6, background: INK_20, borderRadius: 1 }} />} label="Field" />
            <Legend swatch={<span style={{ display: 'inline-block', width: 12, height: 2, background: GOLD, borderRadius: 2 }} />} label="You" />
          </div>
        )}
      </div>
      <div style={{ marginTop: 10, width: '100%' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} aria-hidden>
          <defs>
            <linearGradient id="skyGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FBBC2E" />
              <stop offset="100%" stopColor="#F7931E" />
            </linearGradient>
          </defs>
          {/* baseline */}
          <line x1={PX} x2={W - PX} y1={yBaseline} y2={yBaseline} stroke={INK_08} strokeWidth={1} />
          {/* bars */}
          {sorted.map((h, i) => {
            const isHardest = hardest && h.hole_no === hardest.hole_no;
            const cx = PX + stepX * i + stepX / 2;
            const yTop = yFor(h.avg_to_par);
            const barH = Math.max(1, yBaseline - yTop);
            const fill = isHardest ? INK : INK_20;
            return (
              <rect
                key={h.hole_no}
                x={cx - barW / 2}
                y={yTop}
                width={barW}
                height={barH}
                rx={2}
                fill={fill}
              />
            );
          })}
          {/* hole numbers */}
          {sorted.map((h, i) => {
            const isHardest = hardest && h.hole_no === hardest.hole_no;
            const cx = PX + stepX * i + stepX / 2;
            return (
              <text
                key={h.hole_no}
                x={cx}
                y={H - 1}
                textAnchor="middle"
                fontSize={8}
                fontWeight={isHardest ? 800 : 600}
                fill={isHardest ? INK : INK_55}
                style={{ fontFamily: FONT }}
              >
                {h.hole_no}
              </text>
            );
          })}
          {/* viewer polyline */}
          {segments.map((seg, idx) => (
            <g key={idx}>
              <polyline
                fill="none"
                stroke="url(#skyGold)"
                strokeWidth={1.6}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={seg.map((p) => `${p.x},${p.y}`).join(' ')}
              />
              {seg.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={1.8} fill={GOLD} />
              ))}
            </g>
          ))}
        </svg>
      </div>
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: INK_55,
        }}
      >
        {viewerHasPlayed ? (
          <span>
            Your gold line runs under the field on{' '}
            <span style={{ color: GOLD_INK, fontWeight: 800 }}>{beatFieldCount}</span> of {holes.length}
          </span>
        ) : (
          <span />
        )}
        {hardest && (
          <span style={NUM}>
            Hole {hardest.hole_no} · hardest · +{hardest.avg_to_par.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};

const Legend: React.FC<{ swatch: React.ReactNode; label: string }> = ({ swatch, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', color: INK_55, textTransform: 'uppercase' }}>
    {swatch}
    {label}
  </span>
);

// ──────────────────────────────────────────────────────────────────────
// Ledger
// ──────────────────────────────────────────────────────────────────────

const LedgerCard: React.FC<{
  hardest: CourseHole | null;
  scoreable: CourseHole | null;
  nemesis: MyHolePerformanceRow | null;
  holes: CourseHole[];
  viewerHasPlayed: boolean;
  birdiedCount: number;
  totalHoles: number;
  missingBirdieHole: number | null;
}> = ({ hardest, scoreable, nemesis, viewerHasPlayed, birdiedCount, totalHoles, missingBirdieHole }) => {
  if (!viewerHasPlayed) {
    return (
      <div style={{ ...SECTION_RULE, marginTop: 20 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {hardest && (
            <LedgerCell
              cap="Hardest"
              headline={`Hole ${hardest.hole_no}`}
              body={`The field's toughest test, +${hardest.avg_to_par.toFixed(2)} over par`}
              borderRight
            />
          )}
          {scoreable && (
            <LedgerCell
              cap="Scoreable"
              headline={`Hole ${scoreable.hole_no}`}
              body={`Where the field scores best, ${fmtSigned(scoreable.avg_to_par, 2)}`}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...SECTION_RULE, marginTop: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {hardest && (
          <LedgerCell
            cap="Hardest"
            headline={`Hole ${hardest.hole_no}`}
            body={`The field's toughest test, +${hardest.avg_to_par.toFixed(2)} over par`}
            borderRight
            borderBottom
          />
        )}
        {scoreable && (
          <LedgerCell
            cap="Scoreable"
            headline={`Hole ${scoreable.hole_no}`}
            body={`Where the field scores best, ${fmtSigned(scoreable.avg_to_par, 2)}`}
            borderBottom
          />
        )}
        {nemesis ? (
          <LedgerCell
            cap="Your nemesis"
            headline={`Hole ${nemesis.hole_no}`}
            headlineGold
            body={`Your hardest hole here — you play it to ${fmtSigned(nemesis.avg_to_par, 2)}`}
            borderRight
          />
        ) : (
          <LedgerCell
            cap="Your nemesis"
            headline="—"
            body="Play any hole twice to unlock your nemesis"
            borderRight
          />
        )}
        <LedgerCell
          cap="Birdie map"
          headline={`${birdiedCount}/${totalHoles}`}
          progress={birdiedCount / Math.max(1, totalHoles)}
          body={
            missingBirdieHole
              ? `You've birdied ${birdiedCount} of ${totalHoles} — only the ${ordinal(missingBirdieHole)} remains`
              : `You've birdied ${birdiedCount} of ${totalHoles}`
          }
        />
      </div>
    </div>
  );
};

const LedgerCell: React.FC<{
  cap: string;
  headline: string;
  headlineGold?: boolean;
  progress?: number;
  body: string;
  borderRight?: boolean;
  borderBottom?: boolean;
}> = ({ cap, headline, headlineGold, progress, body, borderRight, borderBottom }) => (
  <div
    style={{
      padding: '12px 14px',
      borderRight: borderRight ? `1px solid ${INK_08}` : undefined,
      borderBottom: borderBottom ? `1px solid ${INK_08}` : undefined,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}
  >
    <div style={CAP}>{cap}</div>
    <div
      style={{
        fontSize: 21,
        fontWeight: 800,
        letterSpacing: '-0.01em',
        color: headlineGold ? GOLD_INK : INK,
        lineHeight: 1,
        ...NUM,
      }}
    >
      {headline}
    </div>
    {progress != null && (
      <div style={{ height: 4, borderRadius: 999, background: INK_08, overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(1, Math.max(0, progress)) * 100}%`,
            height: '100%',
            background: GOLD_GRAD_H,
          }}
        />
      </div>
    )}
    <div style={{ fontSize: 10, fontWeight: 600, color: INK_55, lineHeight: 1.4 }}>{body}</div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────
// Notation key
// ──────────────────────────────────────────────────────────────────────

const NotationKey: React.FC<{ viewerHasPlayed: boolean }> = ({ viewerHasPlayed }) => {
  const items: { kind: HoleGlyphKind; label: string }[] = [
    { kind: 'eagle-or-better', label: 'Eagle+' },
    { kind: 'birdie', label: 'Birdie' },
    { kind: 'par', label: 'Par' },
    { kind: 'bogey', label: 'Bogey' },
    { kind: 'double-plus', label: 'Double+' },
  ];
  return (
    <div style={{ ...CARD, padding: 14, marginBottom: 12 }}>
      <div style={CAP}>How to read</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, rowGap: 10, marginTop: 10 }}>
        {items.map((it) => (
          <div key={it.kind} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <HoleGlyph kind={it.kind} size={20} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: INK }}>{it.label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 10.5, fontWeight: 600, color: INK_35, lineHeight: 1.55 }}>
        Gold circles are under par — a double ring means eagle or better. Squares darken as scores rise.
        Each hole's mix bar shows the community's results in this scale, left to right.
        {viewerHasPlayed ? ' A ○ next to a hole number means you\u2019ve birdied it.' : ''}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Scorecard table
// ──────────────────────────────────────────────────────────────────────

const ScorecardTable: React.FC<{
  label: string;
  rows: CourseHole[];
  myByHole: Map<number, MyHolePerformanceRow>;
  viewerHasPlayed: boolean;
  birdiedHoles: Set<number>;
  openHole: number | null;
  onToggle: (n: number) => void;
  showTotals: boolean;
}> = ({ label, rows, myByHole, viewerHasPlayed, birdiedHoles, openHole, onToggle, showTotals }) => {
  const parSum = rows.reduce((s, h) => s + h.par, 0);
  const fieldSum = rows.reduce((s, h) => s + h.avg_to_par, 0);
  const youSum = rows.reduce((s, h) => {
    const m = myByHole.get(h.hole_no);
    return s + (m ? m.avg_to_par : 0);
  }, 0);
  const youHasAny = rows.some((h) => myByHole.get(h.hole_no));

  const showYou = viewerHasPlayed;
  const cols = showYou ? '32px 26px 22px 1fr 1fr 60px' : '32px 26px 22px 1fr 60px';

  return (
    <div style={{ ...CARD, overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: cols,
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: `1px solid ${INK_08}`,
          background: '#FBFBFC',
        }}
      >
        <TH>{label}</TH>
        <TH>PAR</TH>
        <TH>SI</TH>
        <TH>FIELD</TH>
        {showYou && <TH>YOU</TH>}
        <TH align="right">MIX</TH>
      </div>
      {rows.map((h) => {
        const mine = myByHole.get(h.hole_no);
        const isOpen = openHole === h.hole_no;
        const fieldStrong = h.avg_to_par >= 1.1;
        const youBeats = mine && mine.avg_to_par <= h.avg_to_par + 0.005;
        return (
          <React.Fragment key={h.hole_no}>
            <div
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => onToggle(h.hole_no)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle(h.hole_no);
                }
              }}
              style={{
                display: 'grid',
                gridTemplateColumns: cols,
                alignItems: 'center',
                padding: '10px 12px',
                borderBottom: `1px solid ${INK_08}`,
                cursor: 'pointer',
                background: isOpen ? '#FAFBFC' : '#FFFFFF',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: INK, ...NUM }}>{h.hole_no}</span>
                {birdiedHoles.has(h.hole_no) && (
                  <span
                    aria-hidden
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      border: `1.2px solid ${GOLD}`,
                      background: 'transparent',
                    }}
                  />
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: INK_55, ...NUM }}>{h.par}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: INK_35, ...NUM }}>
                {h.stroke_index ?? '—'}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: fieldStrong ? INK : INK_55, ...NUM }}>
                {fmtSigned(h.avg_to_par, 2)}
              </div>
              {showYou && (
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: !mine ? INK_20 : youBeats ? GOLD_INK : INK_85,
                    ...NUM,
                  }}
                >
                  {mine ? fmtSigned(mine.avg_to_par, 2) : ''}
                </div>
              )}
              <div style={{ paddingLeft: 8 }}>
                <MixBar row={h} />
              </div>
            </div>
            {isOpen && (
              <ExpandedRow
                row={h}
                mine={mine ?? null}
                viewerHasPlayed={viewerHasPlayed}
              />
            )}
          </React.Fragment>
        );
      })}

      {showTotals && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: cols,
            alignItems: 'center',
            padding: '12px 12px',
            background: '#FAFBFC',
            borderTop: `1.5px solid ${INK}`,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', color: INK, textTransform: 'uppercase' }}>
            {label} TOTAL
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: INK, ...NUM }}>{parSum}</div>
          <div />
          <div style={{ fontSize: 13, fontWeight: 800, color: INK, ...NUM }}>
            {fmtSigned(fieldSum, 1)}
          </div>
          {showYou && (
            <div style={{ fontSize: 13, fontWeight: 800, color: youHasAny ? GOLD_INK : INK_20, ...NUM }}>
              {youHasAny ? fmtSigned(youSum, 1) : ''}
            </div>
          )}
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: INK_55, textAlign: 'right' }}>
            OVER / NINE
          </div>
        </div>
      )}
    </div>
  );
};

const TH: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({ children, align }) => (
  <div
    style={{
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: '0.12em',
      color: INK_55,
      textTransform: 'uppercase',
      textAlign: align ?? 'left',
    }}
  >
    {children}
  </div>
);

// ──────────────────────────────────────────────────────────────────────
// Mix bar
// ──────────────────────────────────────────────────────────────────────

const MixBar: React.FC<{ row: CourseHole }> = ({ row }) => {
  const segs = [
    { pct: (row.dist.ace ?? 0) + (row.dist.albatross ?? 0) + (row.dist.eagle ?? 0), bg: GOLD },
    { pct: row.dist.birdie ?? 0, bg: GOLD_GRAD_H },
    { pct: row.dist.par ?? 0, bg: INK_20 },
    { pct: row.dist.bogey ?? 0, bg: INK_55 },
    { pct: row.dist.double ?? 0, bg: INK_85 },
  ];
  const total = Math.max(0.01, segs.reduce((s, x) => s + x.pct, 0));
  return (
    <div style={{ height: 5, background: INK_08, borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
      {segs.map((s, i) => (
        <div key={i} style={{ width: `${(s.pct / total) * 100}%`, height: '100%', background: s.bg }} />
      ))}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Expanded row
// ──────────────────────────────────────────────────────────────────────

const ExpandedRow: React.FC<{
  row: CourseHole;
  mine: MyHolePerformanceRow | null;
  viewerHasPlayed: boolean;
}> = ({ row, mine, viewerHasPlayed }) => {
  const subPar = pctOf(row, ['ace', 'albatross', 'eagle', 'birdie']);
  const parPct = row.dist.par ?? 0;
  const overPar = pctOf(row, ['bogey', 'double']);

  const bars: { kind: HoleGlyphKind; label: string; pct: number; isGold: boolean; fill: string }[] = [
    { kind: 'eagle-or-better', label: 'EAG', pct: pctOf(row, ['ace', 'albatross', 'eagle']), isGold: true, fill: GOLD },
    { kind: 'birdie', label: 'BIRD', pct: row.dist.birdie ?? 0, isGold: true, fill: GOLD_GRAD },
    { kind: 'par', label: 'PAR', pct: row.dist.par ?? 0, isGold: false, fill: INK_20 },
    { kind: 'bogey', label: 'BOG', pct: row.dist.bogey ?? 0, isGold: false, fill: INK_55 },
    { kind: 'double-plus', label: 'DBL+', pct: row.dist.double ?? 0, isGold: false, fill: INK_85 },
  ];
  const chartH = 78; // bar area
  const maxPct = Math.max(1, ...bars.map((b) => b.pct));

  const playsTo = (row.par + row.avg_to_par).toFixed(1);
  const diff = mine ? mine.avg_to_par - row.avg_to_par : null;

  return (
    <div
      style={{
        padding: '14px 12px 12px',
        background: '#FAFBFC',
        borderBottom: `1px solid ${INK_08}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <SummaryTile cap="Sub-par" value={`${Math.round(subPar)}%`} gold={subPar > 0.5} />
        <SummaryTile cap="Par" value={`${Math.round(parPct)}%`} />
        <SummaryTile cap="Over-par" value={`${Math.round(overPar)}%`} />
      </div>

      {/* Distribution chart */}
      <div style={{ paddingTop: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, alignItems: 'end', height: chartH + 22 }}>
          {bars.map((b) => {
            const zero = b.pct < 0.5;
            const h = zero ? 2 : Math.max(4, (b.pct / maxPct) * chartH);
            return (
              <div key={b.kind} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: b.isGold ? GOLD_INK : INK,
                    ...NUM,
                    lineHeight: 1,
                  }}
                >
                  {zero ? '0%' : `${Math.round(b.pct)}%`}
                </div>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 36,
                    height: chartH,
                    background: INK_08,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'flex-end',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ width: '100%', height: h, background: b.fill, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 6, alignItems: 'center' }}>
          {bars.map((b) => (
            <div key={b.kind} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <HoleGlyph kind={b.kind} size={16} />
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', color: INK_55 }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Verdict */}
      <div
        style={{
          paddingTop: 10,
          borderTop: `1px solid ${INK_08}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: INK_55,
              padding: '3px 8px',
              borderRadius: 999,
              background: INK_08,
              ...NUM,
            }}
          >
            {row.rounds.toLocaleString()} rounds
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: INK, ...NUM }}>Plays to {playsTo}</span>
        </div>
        {viewerHasPlayed && mine && diff != null && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: diff <= 0.005 ? GOLD_INK : INK_55,
              ...NUM,
            }}
          >
            {diff <= 0.005
              ? `You beat the field by ${Math.abs(diff).toFixed(2)}`
              : `You trail the field by ${diff.toFixed(2)}`}
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryTile: React.FC<{ cap: string; value: string; gold?: boolean }> = ({ cap, value, gold }) => (
  <div
    style={{
      background: '#FFFFFF',
      border: `1px solid ${INK_08}`,
      borderRadius: 10,
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <div style={CAP}>{cap}</div>
    <div style={{ fontSize: 16, fontWeight: 800, color: gold ? GOLD_INK : INK, ...NUM, lineHeight: 1.1 }}>
      {value}
    </div>
  </div>
);

export default HoleDataSheet;
