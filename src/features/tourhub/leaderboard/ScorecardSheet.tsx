/**
 * ScorecardSheet — Tour Book drill-in sheet.
 *
 * Opens on row tap from BoardTable. Shows the tapped player's round,
 * hole by hole, with field difficulty (sr_hole_statistics scoring_average)
 * as context. Visual grammar matches the leaderboard: #F8FAFC canvas,
 * tab-rule round selector, 8/800/0.08em column header, tabular nums,
 * house color palette (under #189A55, over #C24A4A, even #8A9099) with
 * two extended cases for score cells (eagle-or-better #B36B00, double+
 * #8A2C2C).
 *
 * Data — never silent, always logged on error:
 *   useScorecard(tournamentId, playerId): sr_scorecards select
 *     hole_number, round_number, strokes, par, score_to_par ordered
 *     round_number, hole_number. staleTime 60s.
 *   useHoleStatistics(tournamentId): sr_hole_statistics select
 *     hole_number, round_number, par, yardage, scoring_average, rank.
 *     staleTime 5m.
 *
 * Round selector derives from the scorecard rows present (a player who
 * missed the cut shows R1-R2 only); default selected = highest round
 * present. Unplayed holes in the selected round render par/yards but
 * SCORE '-' MUTED. OUT/IN/TOTAL subtotals sum the strokes column only.
 */

import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BottomSheet } from '@/components/ui/BottomSheet';

const F = 'Geist, system-ui, sans-serif';

const INK = '#0F172A';
const SECONDARY = '#4B5563';
const MUTED = '#94A3B8';
const HAIRLINE = 'rgba(0,0,0,0.08)';
const CANVAS = '#F8FAFC';
const BAND = 'rgba(31,36,40,0.03)';

const SCORE_EAGLE = '#B36B00';
const SCORE_BIRDIE = '#189A55';
const SCORE_BOGEY = '#C24A4A';
const SCORE_DOUBLE = '#8A2C2C';

const HOUSE_UNDER = '#189A55';
const HOUSE_OVER = '#C24A4A';
const HOUSE_EVEN = '#8A9099';

interface ScorecardRow {
  round_number: number;
  hole_number: number;
  strokes: number | null;
  par: number | null;
  score_to_par: number | null;
}

interface HoleStatRow {
  round_number: number;
  hole_number: number;
  par: number | null;
  yardage: number | null;
  scoring_average: number | null;
  rank: number | null;
}

function useScorecard(tournamentId: string | null, playerId: string | null) {
  return useQuery({
    queryKey: ['leaderboard-scorecard', tournamentId, playerId],
    enabled: !!tournamentId && !!playerId,
    staleTime: 60_000,
    queryFn: async (): Promise<ScorecardRow[]> => {
      if (!tournamentId || !playerId) return [];
      const { data, error } = await (supabase as any)
        .from('sr_scorecards')
        .select('hole_number, round_number, strokes, par, score_to_par')
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId)
        .order('round_number', { ascending: true })
        .order('hole_number', { ascending: true });
      if (error) {
        console.error('[scorecard] fetch failed', { tournamentId, playerId, error });
        throw error;
      }
      return (data ?? []) as ScorecardRow[];
    },
  });
}

function useHoleStatistics(tournamentId: string | null) {
  return useQuery({
    queryKey: ['leaderboard-hole-stats', tournamentId],
    enabled: !!tournamentId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<HoleStatRow[]> => {
      if (!tournamentId) return [];
      const { data, error } = await (supabase as any)
        .from('sr_hole_statistics')
        .select('hole_number, round_number, par, yardage, scoring_average, rank')
        .eq('tournament_id', tournamentId);
      if (error) {
        console.error('[scorecard] hole stats fetch failed', { tournamentId, error });
        throw error;
      }
      return (data ?? []) as HoleStatRow[];
    },
  });
}

export interface ScorecardSheetTarget {
  playerId: string;
  playerName: string;
  countryCode?: string | null;
  position: number | null;
  positionTied?: boolean | null;
  total: number | null;
  today: number | null;
  thru: number | null;
  status?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId: string | null;
  target: ScorecardSheetTarget | null;
}

function fmtScoreSigned(n: number | null | undefined): string {
  if (n == null) return '-';
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : String(n);
}

function houseColor(n: number | null | undefined): string {
  if (n == null) return INK;
  if (n < 0) return HOUSE_UNDER;
  if (n > 0) return HOUSE_OVER;
  return HOUSE_EVEN;
}

// SCORE cell color mapping — extended palette (matches spec).
// eagle-or-better -> gold, birdie -> green, par -> ink, bogey -> red,
// double+ -> darker red. Missing par or strokes -> INK.
function scoreCellColor(strokes: number | null, par: number | null): string {
  if (strokes == null || par == null) return INK;
  const d = strokes - par;
  if (d <= -2) return SCORE_EAGLE;
  if (d === -1) return SCORE_BIRDIE;
  if (d === 0) return INK;
  if (d === 1) return SCORE_BOGEY;
  return SCORE_DOUBLE;
}

function isDemotedStatus(s?: string | null): boolean {
  if (!s) return false;
  const u = s.toUpperCase();
  return u === 'MC' || u === 'CUT' || u === 'WD' || u === 'DQ' || u === 'MDF' || u === 'DNS';
}

export function ScorecardSheet({ open, onClose, tournamentId, target }: Props) {
  const navigate = useNavigate();
  const { data: scRows = [] } = useScorecard(tournamentId, target?.playerId ?? null);
  const { data: holeStats = [] } = useHoleStatistics(tournamentId);

  // Rounds present in the data (strokes > 0 on at least one hole).
  const availableRounds = useMemo(() => {
    const set = new Set<number>();
    for (const r of scRows) {
      if (r.strokes != null && r.strokes > 0) set.add(r.round_number);
    }
    return [...set].sort((a, b) => a - b);
  }, [scRows]);

  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  useEffect(() => {
    if (availableRounds.length === 0) {
      setSelectedRound(null);
      return;
    }
    const latest = availableRounds[availableRounds.length - 1];
    setSelectedRound((prev) =>
      prev != null && availableRounds.includes(prev) ? prev : latest,
    );
  }, [availableRounds]);

  // Rows for the selected round — build 18 canonical holes.
  const roundHoles = useMemo(() => {
    if (selectedRound == null) return [] as Array<{
      hole: number;
      par: number | null;
      yards: number | null;
      strokes: number | null;
      fieldAvg: number | null;
    }>;

    const scByHole = new Map<number, ScorecardRow>();
    for (const r of scRows) {
      if (r.round_number === selectedRound) scByHole.set(r.hole_number, r);
    }
    const statByHole = new Map<number, HoleStatRow>();
    for (const s of holeStats) {
      if (s.round_number === selectedRound) statByHole.set(s.hole_number, s);
    }

    const out = [];
    for (let h = 1; h <= 18; h++) {
      const sc = scByHole.get(h);
      const st = statByHole.get(h);
      const strokes = sc?.strokes != null && sc.strokes > 0 ? sc.strokes : null;
      const par = sc?.par ?? st?.par ?? null;
      out.push({
        hole: h,
        par,
        yards: st?.yardage ?? null,
        strokes,
        fieldAvg: st?.scoring_average ?? null,
      });
    }
    return out;
  }, [selectedRound, scRows, holeStats]);

  // Aggregate birdies / bogeys from hole rows (spec: NOT raw_data).
  const roundAgg = useMemo(() => {
    let strokes = 0;
    let toPar = 0;
    let birdies = 0;
    let bogeys = 0;
    for (const h of roundHoles) {
      if (h.strokes == null || h.par == null) continue;
      strokes += h.strokes;
      const d = h.strokes - h.par;
      toPar += d;
      if (d === -1) birdies++;
      if (d === 1) bogeys++;
    }
    return { strokes, toPar, birdies, bogeys };
  }, [roundHoles]);

  // OUT / IN subtotals — sum strokes for played holes in each half.
  const outStrokes = useMemo(
    () => roundHoles.slice(0, 9).reduce((a, h) => a + (h.strokes ?? 0), 0),
    [roundHoles],
  );
  const inStrokes = useMemo(
    () => roundHoles.slice(9, 18).reduce((a, h) => a + (h.strokes ?? 0), 0),
    [roundHoles],
  );

  const demoted = isDemotedStatus(target?.status);
  const posText = demoted
    ? (target?.status || 'CUT').toUpperCase()
    : target?.position == null
    ? '-'
    : `${target.positionTied ? 'T' : ''}${target.position}`;

  const stateLine = demoted
    ? `CUT \u00B7 Total ${fmtScoreSigned(target?.total ?? null)}`
    : `Position ${posText} \u00B7 Total ${fmtScoreSigned(target?.total ?? null)} \u00B7 ${fmtScoreSigned(target?.today ?? null)} today \u00B7 thru ${target?.thru == null ? '-' : target.thru >= 18 ? 'F' : target.thru}`;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      surfaceColor={CANVAS}
      style={{ background: CANVAS }}
    >
      {target && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: F,
            background: CANVAS,
            maxHeight: 'calc(90vh - 24px)',
            overflow: 'hidden',
          }}
        >
          {/* HEADER */}
          <div style={{ padding: '4px 18px 10px', background: CANVAS }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: INK,
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {target.playerName}
                </span>
                {target.countryCode && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: MUTED,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {target.countryCode.toUpperCase()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/tourhub/player/${target.playerId}`);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: F,
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: SECONDARY,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                View profile &gt;
              </button>
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: SECONDARY,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {stateLine.split(' \u00B7 ').map((seg, i, arr) => {
                // Colorize numeric segments with house palette (Total, today).
                let color: string | undefined;
                if (!demoted) {
                  if (i === 1) color = houseColor(target.total);
                  else if (i === 2) color = houseColor(target.today);
                }
                if (demoted && i === 1) color = SECONDARY;
                return (
                  <span key={i}>
                    <span style={{ color: color ?? SECONDARY, fontWeight: color ? 800 : 500 }}>
                      {seg}
                    </span>
                    {i < arr.length - 1 ? ' \u00B7 ' : ''}
                  </span>
                );
              })}
            </div>
          </div>

          {/* ROUND SELECTOR — tab-rule style */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '2px 18px 0',
              borderBottom: `1px solid ${HAIRLINE}`,
              background: CANVAS,
              overflowX: 'auto',
            }}
          >
            {availableRounds.map((r) => {
              const active = r === selectedRound;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRound(r)}
                  style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    padding: '10px 0',
                    cursor: 'pointer',
                    fontFamily: F,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: active ? INK : MUTED,
                    borderBottom: active ? `2px solid ${INK}` : '2px solid transparent',
                    whiteSpace: 'nowrap',
                  }}
                  aria-pressed={active}
                >
                  R{r}
                </button>
              );
            })}
            {availableRounds.length === 0 && (
              <div
                style={{
                  padding: '10px 0',
                  fontSize: 10,
                  fontWeight: 700,
                  color: MUTED,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                No rounds yet
              </div>
            )}
          </div>

          {/* PLAYER'S ROUND LINE */}
          {selectedRound != null && (
            <div
              style={{
                padding: '14px 18px 10px',
                background: CANVAS,
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 200,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {roundAgg.strokes > 0 ? roundAgg.strokes : '-'}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: houseColor(roundAgg.strokes > 0 ? roundAgg.toPar : null),
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {roundAgg.strokes > 0 ? fmtScoreSigned(roundAgg.toPar) : ''}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: SECONDARY,
                  fontVariantNumeric: 'tabular-nums',
                  marginLeft: 4,
                }}
              >
                {roundAgg.birdies} birdies \u00B7 {roundAgg.bogeys} bogeys
              </span>
            </div>
          )}

          {/* HOLE TABLE — scroll area */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
              background: CANVAS,
            }}
          >
            {/* Column header (sticky within sheet scroll) */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                padding: '8px 18px',
                background: CANVAS,
                borderTop: `1px solid ${HAIRLINE}`,
                borderBottom: `1px solid ${HAIRLINE}`,
                fontFamily: F,
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: SECONDARY,
                textTransform: 'uppercase',
              }}
            >
              <div style={{ width: 32, flexShrink: 0 }}>HOLE</div>
              <div style={{ width: 40, flexShrink: 0, textAlign: 'center' }}>PAR</div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>YDS</div>
              <div style={{ width: 52, flexShrink: 0, textAlign: 'center' }}>SCORE</div>
              <div style={{ width: 52, flexShrink: 0, textAlign: 'center' }}>FIELD</div>
            </div>

            {selectedRound != null && renderHoleRows(roundHoles, outStrokes, inStrokes, roundAgg)}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

function renderHoleRows(
  roundHoles: Array<{
    hole: number;
    par: number | null;
    yards: number | null;
    strokes: number | null;
    fieldAvg: number | null;
  }>,
  outStrokes: number,
  inStrokes: number,
  roundAgg: { strokes: number; toPar: number },
) {
  const parts: React.ReactNode[] = [];

  const row = (h: (typeof roundHoles)[number]) => {
    const played = h.strokes != null;
    const scoreColor = scoreCellColor(h.strokes, h.par);
    // FIELD color relative to par
    let fieldColor = SECONDARY;
    if (h.fieldAvg != null && h.par != null) {
      const d = h.fieldAvg - h.par;
      if (d < -0.005) fieldColor = HOUSE_UNDER;
      else if (d > 0.005) fieldColor = HOUSE_OVER;
      else fieldColor = SECONDARY;
    }
    return (
      <div
        key={`h-${h.hole}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8.5px 18px',
          borderBottom: `1px solid ${HAIRLINE}`,
          background: CANVAS,
          fontFamily: F,
        }}
      >
        <div
          style={{
            width: 32,
            flexShrink: 0,
            fontSize: 12,
            fontWeight: 800,
            color: INK,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {h.hole}
        </div>
        <div
          style={{
            width: 40,
            flexShrink: 0,
            textAlign: 'center',
            fontSize: 11.5,
            color: SECONDARY,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {h.par ?? '-'}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: 'center',
            fontSize: 11.5,
            color: SECONDARY,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {h.yards ?? '-'}
        </div>
        <div
          style={{
            width: 52,
            flexShrink: 0,
            textAlign: 'center',
            fontSize: 12.5,
            fontWeight: 800,
            color: played ? scoreColor : MUTED,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {played ? h.strokes : '-'}
        </div>
        <div
          style={{
            width: 52,
            flexShrink: 0,
            textAlign: 'center',
            fontSize: 10.5,
            fontWeight: 700,
            color: fieldColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {h.fieldAvg != null ? h.fieldAvg.toFixed(2) : '-'}
        </div>
      </div>
    );
  };

  const subtotalRow = (label: 'OUT' | 'IN', total: number) => (
    <div
      key={`sub-${label}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 18px',
        borderBottom: `1px solid ${HAIRLINE}`,
        background: BAND,
        fontFamily: F,
      }}
    >
      <div
        style={{
          width: 32,
          flexShrink: 0,
          fontSize: 8.5,
          fontWeight: 800,
          color: INK,
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          width: 52,
          flexShrink: 0,
          textAlign: 'center',
          fontSize: 12.5,
          fontWeight: 800,
          color: INK,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {total > 0 ? total : '-'}
      </div>
      <div style={{ width: 52, flexShrink: 0 }} />
    </div>
  );

  const totalRow = () => (
    <div
      key="total-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 18px',
        borderBottom: `1px solid ${HAIRLINE}`,
        background: BAND,
        fontFamily: F,
      }}
    >
      <div
        style={{
          flex: 1,
          fontSize: 9.5,
          fontWeight: 800,
          color: INK,
          letterSpacing: '0.08em',
        }}
      >
        TOTAL
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: INK,
          fontVariantNumeric: 'tabular-nums',
          marginRight: 8,
        }}
      >
        {roundAgg.strokes > 0 ? roundAgg.strokes : '-'}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: houseColor(roundAgg.strokes > 0 ? roundAgg.toPar : null),
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {roundAgg.strokes > 0 ? `(${fmtScoreSigned(roundAgg.toPar)})` : ''}
      </div>
    </div>
  );

  for (let i = 0; i < roundHoles.length; i++) {
    parts.push(row(roundHoles[i]));
    if (i === 8) parts.push(subtotalRow('OUT', outStrokes));
    if (i === 17) {
      parts.push(subtotalRow('IN', inStrokes));
      parts.push(totalRow());
    }
  }

  return parts;
}

export default ScorecardSheet;
