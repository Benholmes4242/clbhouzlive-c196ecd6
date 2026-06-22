import { Link } from 'react-router-dom';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { PlayerInitialAvatar } from '../shared/PlayerInitialAvatar';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useTourSeason } from '../../hooks/useTourHubData';
import { playerRoute } from '../../routes';
import type { CollegeCompareData } from '../../hooks/useCollegeCompare';
import type { CollegeAlumnus } from '../../hooks/useCollegeAlumni';
import { AMBER, AMBER_TINT_08, HAIRLINE_INK_8, HAIRLINE_INK_12, HAIRLINE_INK_18, INK, INK_FAINT, INK_MUTE, INK_TINT_02, INK_TINT_04, INK_TINT_05, INK_TINT_06, INK_TINT_07, SURFACE } from '../../_shared/tokens';

interface CollegeCompareHeroProps {
  data: CollegeCompareData;
  className?: string;
}

/* ── Metric compare row with visual bar ── */
interface MetricCompareRowProps {
  label: string;
  value1: number;
  value2: number;
  format?: (v: number) => string;
  lowerIsBetter?: boolean;
  isLast?: boolean;
}

function MetricCompareRow({ label, value1, value2, format = String, lowerIsBetter = false, isLast = false }: MetricCompareRowProps) {
  // Determine leader (TIED when both sides have meaningful, equal values)
  let isLeading1 = false;
  let isLeading2 = false;
  let isTied = false;
  if (value1 === 0 && value2 === 0) {
    // Both empty — neither leads, not "tied" (no data to tie on)
  } else if (value1 === value2) {
    isTied = true;
  } else if (lowerIsBetter) {
    if (value1 > 0 && value2 > 0) {
      isLeading1 = value1 < value2;
      isLeading2 = value2 < value1;
    }
  } else {
    isLeading1 = value1 > value2;
    isLeading2 = value2 > value1;
  }

  // Center-split bar: each side grows out from the center toward its own edge.
  // Bar width is proportional to the side's share of the larger value (max = 100% of half).
  const maxVal = Math.max(value1, value2);
  const barPct1 = maxVal > 0 ? (value1 / maxVal) * 100 : 0;
  const barPct2 = maxVal > 0 ? (value2 / maxVal) * 100 : 0;

  // Canonical font weights: value 900 (leader) / 600 (non-leader), label 800
  const value1Weight = isLeading1 ? 900 : 600;
  const value2Weight = isLeading2 ? 900 : 600;
  const value1Color = isLeading1 ? INK : INK_FAINT;
  const value2Color = isLeading2 ? INK : INK_FAINT;

  return (
    <div style={{ padding: '9px 16px', borderBottom: isLast ? 'none' : `0.5px solid ${INK_TINT_07}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
        <span style={{ flex: 1, fontSize: '15px', fontWeight: value1Weight, color: value1Color, fontVariantNumeric: 'tabular-nums', textAlign: 'left' as const }}>
          {format(value1)}
        </span>
        {isTied ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ padding: '2px 6px', borderRadius: '4px', background: INK_TINT_06, fontSize: '9px', fontWeight: 800, color: INK, letterSpacing: '0.14em' }}>
              TIED
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: INK_FAINT, letterSpacing: '0.14em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
              {label}
            </span>
          </span>
        ) : (
          <span style={{ fontSize: '11px', fontWeight: 800, color: INK_FAINT, letterSpacing: '0.14em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
            {label}
          </span>
        )}
        <span style={{ flex: 1, fontSize: '15px', fontWeight: value2Weight, color: value2Color, fontVariantNumeric: 'tabular-nums', textAlign: 'right' as const }}>
          {format(value2)}
        </span>
      </div>
      {/* Center-split bar: left bar grows leftward from centre, right bar grows rightward */}
      <div style={{ display: 'flex', alignItems: 'center', height: '3px' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', height: '100%' }}>
          <div
            style={{
              width: `${barPct1}%`,
              height: '100%',
              borderRadius: '2px 0 0 2px',
              background: isLeading1 ? AMBER : isTied ? HAIRLINE_INK_18 : HAIRLINE_INK_8,
              transition: 'width 0.4s',
            }}
          />
        </div>
        <div style={{ width: '1px', height: '100%', background: HAIRLINE_INK_12, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', height: '100%' }}>
          <div
            style={{
              width: `${barPct2}%`,
              height: '100%',
              borderRadius: '0 2px 2px 0',
              background: isLeading2 ? AMBER : isTied ? HAIRLINE_INK_18 : HAIRLINE_INK_8,
              transition: 'width 0.4s',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Alumni compare block ── */
interface AlumniCompareBlockProps {
  title: string;
  alumni1: CollegeAlumnus[];
  alumni2: CollegeAlumnus[];
  statKey: 'earnings' | 'world_ranking' | 'wins';
  name1: string;
  name2: string;
  emptyLabel?: string;
}

function AlumniCompareBlock({ title, alumni1, alumni2, statKey, name1, name2, emptyLabel }: AlumniCompareBlockProps) {
  const formatStat = (a: CollegeAlumnus): string => {
    if (statKey === 'earnings') return formatCurrency(a.earnings || 0);
    if (statKey === 'world_ranking') return a.world_ranking ? `#${a.world_ranking}` : '—';
    const w = a.wins || 0;
    return `${w} win${w !== 1 ? 's' : ''}`;
  };

  const rowCount = Math.max(alumni1.length, alumni2.length);
  if (rowCount === 0) return null;

  return (
    <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}>
      {/* Section eyebrow — canonical §6 slate-caps */}
      <div style={{ padding: '14px 16px 10px' }}>
        <span style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          {title}
        </span>
      </div>

      {/* Column headers */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 16px', background: INK_TINT_02, borderTop: `0.5px solid ${INK_TINT_07}`, borderBottom: `0.5px solid ${INK_TINT_07}` }}>
        <span style={{ width: '18px', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '9px', fontWeight: 800, color: INK_FAINT, letterSpacing: '0.14em', paddingRight: '8px' }}>
          {name1.toUpperCase()}
        </span>
        <div style={{ width: '1px', height: '12px', background: INK_TINT_07, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '9px', fontWeight: 800, color: INK_FAINT, letterSpacing: '0.14em', paddingLeft: '8px' }}>
          {name2.toUpperCase()}
        </span>
      </div>

      {/* Side-by-side rows */}
      {Array.from({ length: rowCount }).map((_, i) => {
        const a1 = alumni1[i] || null;
        const a2 = alumni2[i] || null;
        const isLast = i === rowCount - 1;

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', borderBottom: isLast ? 'none' : `0.5px solid ${INK_TINT_07}` }}>
            <span style={{ width: '18px', fontSize: '10px', fontWeight: 700, color: HAIRLINE_INK_18, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {i + 1}
            </span>

            {/* Left alumnus */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, paddingRight: '8px' }}>
              {a1 ? (
                <Link
                  {...playerRoute(a1.id, a1.college ? { kind: 'college', collegeName: a1.college } : undefined)}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, textDecoration: 'none', flex: 1 }}
                  className="active:opacity-70 transition-opacity"
                >
                  <div style={{ width: '26px', height: '26px', borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: INK_TINT_06 }}>
                    <img
                      src={getPlayerHeadshotUrl(`${a1.first_name} ${a1.last_name}`, a1.tour_codes?.[0] ?? 'pga')}
                      alt={`${a1.first_name} ${a1.last_name}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }}
                      onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {a1.last_name}
                    </div>
                    <div style={{ fontSize: '11px', color: AMBER, fontVariantNumeric: 'tabular-nums' }}>
                      {formatStat(a1)}
                    </div>
                  </div>
                </Link>
              ) : (
                <span style={{ fontSize: '13px', color: INK_FAINT }}>{emptyLabel || '—'}</span>
              )}
            </div>

            {/* Centre divider */}
            <div style={{ width: '1px', height: '36px', background: INK_TINT_07, flexShrink: 0 }} />

            {/* Right alumnus */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, paddingLeft: '8px' }}>
              {a2 ? (
                <Link
                  {...playerRoute(a2.id, a2.college ? { kind: 'college', collegeName: a2.college } : undefined)}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, textDecoration: 'none', flex: 1 }}
                  className="active:opacity-70 transition-opacity"
                >
                  <div style={{ width: '26px', height: '26px', borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: INK_TINT_06 }}>
                    <img
                      src={getPlayerHeadshotUrl(`${a2.first_name} ${a2.last_name}`, a2.tour_codes?.[0] ?? 'pga')}
                      alt={`${a2.first_name} ${a2.last_name}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }}
                      onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {a2.last_name}
                    </div>
                    <div style={{ fontSize: '11px', color: AMBER, fontVariantNumeric: 'tabular-nums' }}>
                      {formatStat(a2)}
                    </div>
                  </div>
                </Link>
              ) : (
                <span style={{ fontSize: '13px', color: INK_FAINT }}>{emptyLabel || '—'}</span>
              )}
            </div>
          </div>
        );
      })}
      <div style={{ height: '4px' }} />
    </div>
  );
}

/* ── Helpers ── */
function formatPct(v: number): string {
  if (!v) return '—';
  return `${v.toFixed(1)}%`;
}

function formatAvg(v: number): string {
  if (!v) return '—';
  return v.toFixed(2);
}

function formatDist(v: number): string {
  if (!v) return '—';
  return `${v.toFixed(1)} yds`;
}

function formatSg(v: number): string {
  if (!v) return '—';
  return v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
}

function formatEarnings(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

/* ── Main component ── */
export function CollegeCompareHero({ data, className }: CollegeCompareHeroProps) {
  const { college1, college2 } = data;
  const { data: season } = useTourSeason();
  const seasonYear = season?.year || new Date().getFullYear();

  const name1 = college1.media?.short_name || college1.media?.college_name || 'College 1';
  const name2 = college2.media?.short_name || college2.media?.college_name || 'College 2';

  const logo1 = getCollegeLogoUrl(college1.media?.college_name || name1);
  const logo2 = getCollegeLogoUrl(college2.media?.college_name || name2);

  const s1 = college1.stats;
  const s2 = college2.stats;

  // Check if performance/ball-striking data exists
  const hasPerformanceData = !!(
    s1?.avg_scoring || s2?.avg_scoring ||
    s1?.avg_sg_total || s2?.avg_sg_total ||
    s1?.avg_putting || s2?.avg_putting ||
    s1?.avg_scrambling || s2?.avg_scrambling
  );

  const hasBallStrikingData = !!(
    s1?.avg_driving_distance || s2?.avg_driving_distance ||
    s1?.avg_driving_accuracy || s2?.avg_driving_accuracy ||
    s1?.avg_gir || s2?.avg_gir ||
    s1?.avg_sand_saves || s2?.avg_sand_saves
  );

  // Count categories led
  const comparisons: [number, number, boolean][] = [
    [s1?.earnings_total || 0, s2?.earnings_total || 0, false],
    [s1?.wins_total || 0, s2?.wins_total || 0, false],
    [s1?.top10_total || 0, s2?.top10_total || 0, false],
    [s1?.top25_total || 0, s2?.top25_total || 0, false],
    [s1?.events_total || 0, s2?.events_total || 0, false],
    [s1?.player_count || 0, s2?.player_count || 0, false],
  ];

  if (hasPerformanceData) {
    comparisons.push(
      [s1?.avg_scoring || 0, s2?.avg_scoring || 0, true],
      [s1?.avg_sg_total || 0, s2?.avg_sg_total || 0, false],
      [s1?.avg_putting || 0, s2?.avg_putting || 0, true],
      [s1?.avg_scrambling || 0, s2?.avg_scrambling || 0, false],
    );
  }
  if (hasBallStrikingData) {
    comparisons.push(
      [s1?.avg_driving_distance || 0, s2?.avg_driving_distance || 0, false],
      [s1?.avg_driving_accuracy || 0, s2?.avg_driving_accuracy || 0, false],
      [s1?.avg_gir || 0, s2?.avg_gir || 0, false],
      [s1?.avg_sand_saves || 0, s2?.avg_sand_saves || 0, false],
    );
  }

  let c1Wins = 0;
  let c2Wins = 0;
  comparisons.forEach(([v1, v2, lowerBetter]) => {
    if (v1 === 0 && v2 === 0) return;
    if (lowerBetter) {
      if (v1 > 0 && v2 > 0) {
        if (v1 < v2) c1Wins++;
        else if (v2 < v1) c2Wins++;
      }
    } else {
      if (v1 > v2) c1Wins++;
      else if (v2 > v1) c2Wins++;
    }
  });

  return (
    <div className={className}>
      {/* ── SEASON VERDICT ── */}
      <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}>
        {/* Section eyebrow — canonical §6 slate-caps */}
        <div style={{ padding: '14px 16px 10px' }}>
          <span style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Season Verdict · {seasonYear}
          </span>
        </div>

        {/* Three-column verdict — Path B: absorbs earnings + alumni count from old VS band */}
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '12px 16px 18px', borderTop: `0.5px solid ${INK_TINT_07}` }}>
          {/* College 1 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, overflow: 'hidden', background: INK_TINT_04, border: `1px solid ${HAIRLINE_INK_8}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {logo1 ? (
                <img src={logo1} alt={name1} style={{ width: 32, height: 32, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <span style={{ fontSize: 17, fontWeight: 900, color: 'rgba(15,23,42,0.3)' }}>{name1.charAt(0)}</span>
              )}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: INK, textAlign: 'center' as const, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{name1}</div>
            <div style={{
              fontSize: 18, fontWeight: 800,
              color: c1Wins >= c2Wins ? INK : INK_FAINT,
              letterSpacing: '-0.02em', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums', marginTop: 2,
            }}>
              {formatEarnings(s1?.earnings_total || 0)}
            </div>
            <div style={{ fontSize: 11, color: INK_FAINT, fontWeight: 500 }}>
              {s1?.player_count || 0} alumni
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900,
              color: c1Wins > c2Wins ? AMBER : INK_FAINT,
              letterSpacing: '-0.04em', lineHeight: 1, marginTop: 6,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {c1Wins}
            </div>
            <div style={{ fontSize: 11, color: INK_FAINT, fontWeight: 500 }}>categories led</div>
          </div>

          {/* Centre — verdict chip */}
          {/* paddingTop: 70 manually aligns the chip with the categories-led row. If logo
              tile size or row spacing changes, recalculate. */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', paddingTop: 70 }}>
            <div style={{ padding: '4px 10px', borderRadius: 6, background: c1Wins === c2Wins ? INK_TINT_05 : AMBER_TINT_08, border: `1px solid ${c1Wins === c2Wins ? HAIRLINE_INK_8 : 'rgba(247,147,30,0.32)'}` }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: c1Wins === c2Wins ? INK_FAINT : AMBER, letterSpacing: '0.14em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
                {c1Wins === c2Wins
                  ? 'TIED'
                  : c1Wins > c2Wins
                    ? `${name1.split(' ')[0].toUpperCase()} WINS`
                    : `${name2.split(' ')[0].toUpperCase()} WINS`}
              </span>
            </div>
          </div>

          {/* College 2 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, overflow: 'hidden', background: INK_TINT_04, border: `1px solid ${HAIRLINE_INK_8}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {logo2 ? (
                <img src={logo2} alt={name2} style={{ width: 32, height: 32, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <span style={{ fontSize: 17, fontWeight: 900, color: 'rgba(15,23,42,0.3)' }}>{name2.charAt(0)}</span>
              )}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: INK, textAlign: 'center' as const, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{name2}</div>
            <div style={{
              fontSize: 18, fontWeight: 800,
              color: c2Wins >= c1Wins ? INK : INK_FAINT,
              letterSpacing: '-0.02em', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums', marginTop: 2,
            }}>
              {formatEarnings(s2?.earnings_total || 0)}
            </div>
            <div style={{ fontSize: 11, color: INK_FAINT, fontWeight: 500 }}>
              {s2?.player_count || 0} alumni
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900,
              color: c2Wins > c1Wins ? AMBER : INK_FAINT,
              letterSpacing: '-0.04em', lineHeight: 1, marginTop: 6,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {c2Wins}
            </div>
            <div style={{ fontSize: 11, color: INK_FAINT, fontWeight: 500 }}>categories led</div>
          </div>
        </div>
      </div>

      {/* ── SEASON OVERVIEW ── */}
      <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}>
        {/* Mini logo column headers */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 0' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '4px', overflow: 'hidden', background: INK_TINT_04, border: `1px solid ${HAIRLINE_INK_8}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {logo1 ? <img src={logo1} alt={name1} style={{ width: '13px', height: '13px', objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} /> : null}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: INK_MUTE }}>{name1}</span>
          </div>
          <span style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Season Overview</span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: INK_MUTE }}>{name2}</span>
            <div style={{ width: '18px', height: '18px', borderRadius: '4px', overflow: 'hidden', background: INK_TINT_04, border: `1px solid ${HAIRLINE_INK_8}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {logo2 ? <img src={logo2} alt={name2} style={{ width: '13px', height: '13px', objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} /> : null}
            </div>
          </div>
        </div>

        <div style={{ borderTop: `0.5px solid ${INK_TINT_07}`, marginTop: '6px' }}>
          <MetricCompareRow label="Earnings" value1={s1?.earnings_total || 0} value2={s2?.earnings_total || 0} format={formatCurrency} />
          <MetricCompareRow label="Wins" value1={s1?.wins_total || 0} value2={s2?.wins_total || 0} />
          <MetricCompareRow label="Top 10s" value1={s1?.top10_total || 0} value2={s2?.top10_total || 0} />
          <MetricCompareRow label="Top 25s" value1={s1?.top25_total || 0} value2={s2?.top25_total || 0} />
          <MetricCompareRow label="Events Played" value1={s1?.events_total || 0} value2={s2?.events_total || 0} />
          <MetricCompareRow label="Players on Tour" value1={s1?.player_count || 0} value2={s2?.player_count || 0} isLast />
        </div>
      </div>

      {/* ── PERFORMANCE STATS ── */}
      {hasPerformanceData && (
        <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}>
          <div style={{ padding: '14px 16px 10px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Performance Stats</span>
          </div>
          <div style={{ borderTop: `0.5px solid ${INK_TINT_07}` }}>
            <MetricCompareRow label="Avg Scoring" value1={s1?.avg_scoring || 0} value2={s2?.avg_scoring || 0} format={formatAvg} lowerIsBetter />
            <MetricCompareRow label="Avg SG Total" value1={s1?.avg_sg_total || 0} value2={s2?.avg_sg_total || 0} format={formatSg} />
            <MetricCompareRow label="Avg Putting" value1={s1?.avg_putting || 0} value2={s2?.avg_putting || 0} format={formatAvg} lowerIsBetter />
            <MetricCompareRow label="Avg Scrambling" value1={s1?.avg_scrambling || 0} value2={s2?.avg_scrambling || 0} format={formatPct} isLast />
          </div>
        </div>
      )}

      {/* ── BALL STRIKING ── */}
      {hasBallStrikingData && (
        <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}>
          <div style={{ padding: '14px 16px 10px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Ball Striking</span>
          </div>
          <div style={{ borderTop: `0.5px solid ${INK_TINT_07}` }}>
            <MetricCompareRow label="Driving Distance" value1={s1?.avg_driving_distance || 0} value2={s2?.avg_driving_distance || 0} format={formatDist} />
            <MetricCompareRow label="Driving Accuracy" value1={s1?.avg_driving_accuracy || 0} value2={s2?.avg_driving_accuracy || 0} format={formatPct} />
            <MetricCompareRow label="GIR" value1={s1?.avg_gir || 0} value2={s2?.avg_gir || 0} format={formatPct} />
            <MetricCompareRow label="Sand Saves" value1={s1?.avg_sand_saves || 0} value2={s2?.avg_sand_saves || 0} format={formatPct} isLast />
          </div>
        </div>
      )}

      {/* ── ALUMNI BLOCKS ── */}
      <AlumniCompareBlock
        title="Top Earners"
        alumni1={college1.topEarners}
        alumni2={college2.topEarners}
        statKey="earnings"
        name1={name1}
        name2={name2}
      />
      <AlumniCompareBlock
        title="Best World Rankings"
        alumni1={college1.topRanked}
        alumni2={college2.topRanked}
        statKey="world_ranking"
        name1={name1}
        name2={name2}
      />
      <AlumniCompareBlock
        title="Top Winners"
        alumni1={college1.topWinners}
        alumni2={college2.topWinners}
        statKey="wins"
        name1={name1}
        name2={name2}
        emptyLabel="No winners this season"
      />
    </div>
  );
}
