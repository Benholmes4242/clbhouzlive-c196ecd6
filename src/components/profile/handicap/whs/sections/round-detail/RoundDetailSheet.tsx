import React, { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useRoundDetail } from '@/lib/whs/hooks';
import { SCORECARD_DARK } from '@/features/courses/_shared/scorecard/scorecardTheme';
import { TrajectoryLine, type TrajectoryHole } from '@/features/courses/_shared/scorecard/TrajectoryLine';
import { NineGrid } from '@/features/courses/_shared/scorecard/NineGrid';
import type { WhsScoreHole } from '@/lib/whs/types';

const T = SCORECARD_DARK;
const GEIST = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const NUM: React.CSSProperties = {
  fontFamily: GEIST,
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"zero" 0',
};

// ─── Props (unchanged API) ───────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  scoreId?: string | null;
  handicapDelta?: number | null;
  connectionId?: string | null;
  /** Kept for back-compat. Sheet is always dark on the handicap page. */
  variant?: 'dark' | 'light';
}

function strokesOf(h: WhsScoreHole): number | null {
  return h.adjusted_gross ?? h.actual_gross ?? null;
}

function fmtRel(n: number | null): string {
  if (n == null) return '—';
  return n === 0 ? 'E' : n < 0 ? `\u2212${Math.abs(n)}` : `+${n}`;
}

function fmtDiff(n: number | null): string {
  if (n == null) return '—';
  const r = Math.round(n * 10) / 10;
  return r === 0 ? '0.0' : r > 0 ? `+${r.toFixed(1)}` : `\u2212${Math.abs(r).toFixed(1)}`;
}

function fmtDateEyebrow(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dow = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
  const day = d.getDate();
  const mon = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  return `${dow}, ${day} ${mon}`;
}

const SheetSkeleton: React.FC = () => (
  <div style={{ padding: '14px 20px 20px' }} className="animate-pulse">
    <div style={{ height: 12, width: 140, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
    <div style={{ height: 22, width: '70%', background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginTop: 10 }} />
    <div style={{ height: 88, background: 'rgba(255,255,255,0.06)', borderRadius: 10, marginTop: 18 }} />
    <div style={{ height: 140, background: 'rgba(255,255,255,0.06)', borderRadius: 10, marginTop: 14 }} />
  </div>
);

const SheetEmpty: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: GEIST }}>
    <p style={{ margin: '0 0 8px', fontSize: 14, color: T.dim }}>No round to show yet.</p>
    <button
      onClick={onClose}
      style={{
        marginTop: 16, padding: '10px 20px', borderRadius: 999,
        background: '#F7931E', color: '#fff', border: 'none',
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }}
    >
      Close
    </button>
  </div>
);

export const RoundDetailSheet: React.FC<Props> = ({ open, onClose, scoreId, handicapDelta }) => {
  const userQuery = useRoundDetail(scoreId, open);
  const userData = userQuery.data;
  const userLoading = userQuery.isLoading;

  const parTotal = useMemo<number | null>(() => {
    const holes = userData?.holes;
    if (!holes || holes.length === 0) return null;
    let total = 0;
    let any = false;
    for (const h of holes) {
      if (h.par != null) { total += h.par; any = true; }
    }
    return any ? total : null;
  }, [userData]);

  const previousIndex = userData?.handicap_index_at_time ?? null;
  const postIndex =
    previousIndex != null && handicapDelta != null
      ? Number((previousIndex + handicapDelta).toFixed(1))
      : previousIndex;

  const indexMoved = handicapDelta != null && Math.abs(handicapDelta) >= 0.05 && previousIndex != null;

  const sortedHoles = useMemo(() => {
    if (!userData?.holes) return [] as WhsScoreHole[];
    return [...userData.holes].sort((a, b) => a.hole_no - b.hole_no);
  }, [userData]);
  const front9 = sortedHoles.filter((h) => h.hole_no <= 9);
  const back9 = userData?.is_nine_hole ? [] : sortedHoles.filter((h) => h.hole_no > 9);
  const hasHoles = sortedHoles.length > 0;

  const totalStrokes = sortedHoles.reduce((a, h) => a + (strokesOf(h) ?? 0), 0);
  const totalPar = sortedHoles.reduce((a, h) => a + (h.par ?? 0), 0);
  const holesPlayed = sortedHoles.filter((h) => strokesOf(h) != null).length;
  const roundRel = hasHoles && holesPlayed > 0 ? totalStrokes - totalPar : null;

  const dateEyebrow = fmtDateEyebrow(userData?.play_date);
  const courseName = userData?.course?.name ?? 'Unknown course';

  const indexLabel = indexMoved ? 'INDEX AFTER THIS ROUND' : 'CURRENT INDEX';
  const deltaColor = handicapDelta == null ? T.dim : handicapDelta < 0 ? T.under : T.over;
  const arrow = handicapDelta == null ? '' : handicapDelta < 0 ? '▼' : '▲';

  const trajectoryHoles: TrajectoryHole[] = useMemo(
    () => sortedHoles.map((h) => ({ holeNo: h.hole_no, par: h.par ?? null, strokes: strokesOf(h) })),
    [sortedHoles],
  );
  const front9T: TrajectoryHole[] = front9.map((h) => ({ holeNo: h.hole_no, par: h.par ?? null, strokes: strokesOf(h) }));
  const back9T: TrajectoryHole[] = back9.map((h) => ({ holeNo: h.hole_no, par: h.par ?? null, strokes: strokesOf(h) }));

  const roundRelColor = roundRel == null ? T.ink : roundRel < 0 ? T.under : roundRel > 0 ? T.over : T.ink;
  const diffColor = userData?.handicap_differential == null
    ? T.ink
    : userData.handicap_differential < 0 ? T.under : userData.handicap_differential > 0 ? T.over : T.ink;

  const plottableCount = trajectoryHoles.filter((h) => h.par != null && h.strokes != null).length;

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="round-detail-sheet-title" variant="dark">
      {userLoading ? (
        <SheetSkeleton />
      ) : !userData ? (
        <SheetEmpty onClose={onClose} />
      ) : (
        <>
          {/* HEADER */}
          <div style={{ padding: '14px 20px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              {dateEyebrow && (
                <span style={{ ...NUM, fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: '0.06em' }}>
                  {dateEyebrow}
                </span>
              )}
              {(parTotal != null || userData.slope_rating != null) && (
                <>
                  {dateEyebrow && <span style={{ fontSize: 11, color: T.faint }}>·</span>}
                  <span style={{ ...NUM, fontSize: 11, fontWeight: 700, color: T.faint, letterSpacing: '0.04em' }}>
                    {parTotal != null ? `PAR ${parTotal}` : ''}
                    {parTotal != null && userData.slope_rating != null ? ' · ' : ''}
                    {userData.slope_rating != null ? `SL ${userData.slope_rating}` : ''}
                  </span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
              <div
                id="round-detail-sheet-title"
                style={{
                  fontFamily: GEIST,
                  fontSize: 20,
                  fontWeight: 800,
                  color: T.ink,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.15,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  flex: 1,
                  minWidth: 0,
                  paddingTop: 6,
                }}
              >
                {courseName}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                <span style={{
                  ...NUM,
                  fontSize: 58,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  lineHeight: 0.85,
                  color: roundRelColor,
                }}>
                  {fmtRel(roundRel)}
                </span>
                <span style={{
                  fontFamily: GEIST, fontSize: 8.5, fontWeight: 800,
                  color: T.faint, letterSpacing: '0.14em', marginTop: 6,
                }}>
                  THIS ROUND
                </span>
              </div>
            </div>

            {/* Mini stats */}
            <div style={{ display: 'flex', gap: 22, marginTop: 14 }}>
              {[
                { label: 'GROSS', value: userData.adjusted_gross ?? null, color: T.ink },
                { label: 'STBL', value: userData.stableford_points ?? null, color: T.ink },
                { label: 'DIFF', value: userData.handicap_differential != null ? fmtDiff(userData.handicap_differential) : null, color: diffColor },
              ].map((s) => (
                <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ ...NUM, fontSize: 15, fontWeight: 800, color: s.value == null ? T.faint : s.color, lineHeight: 1 }}>
                    {s.value ?? '—'}
                  </span>
                  <span style={{ fontFamily: GEIST, fontSize: 8, fontWeight: 800, color: T.faint, letterSpacing: '0.12em' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TRAJECTORY */}
          {plottableCount >= 2 && (
            <div style={{ padding: '10px 16px 0' }}>
              <div style={{
                fontFamily: GEIST, fontSize: 9, fontWeight: 800,
                color: T.faint, letterSpacing: '0.12em', marginBottom: 6,
              }}>
                THE SHAPE OF YOUR ROUND
              </div>
              <TrajectoryLine holes={trajectoryHoles} surface="dark" theme={T} />
            </div>
          )}

          {/* GRID */}
          {hasHoles ? (
            <div style={{
              padding: '12px 16px 16px',
              borderTop: `1px solid ${T.line}`,
              marginTop: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 15,
            }}>
              <NineGrid holes={front9T} label="OUT" startAt={1} surface="dark" theme={T} />
              {!userData.is_nine_hole && back9.length > 0 && (
                <NineGrid holes={back9T} label="IN" startAt={10} surface="dark" theme={T} />
              )}
            </div>
          ) : (
            <div style={{
              padding: '30px 20px 40px', textAlign: 'center', color: T.dim,
              fontSize: 13, fontFamily: GEIST, borderTop: `1px solid ${T.line}`, marginTop: 10,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: T.dim }}>
                {userData.hole_by_hole_fetched
                  ? 'No hole-by-hole data for this round.'
                  : 'Hole data is still syncing'}
              </div>
              {!userData.hole_by_hole_fetched && (
                <div style={{ fontSize: 12, color: T.faint }}>Check back in a few hours.</div>
              )}
            </div>
          )}

          {/* FOOTER */}
          <div style={{
            padding: '15px 20px calc(22px + env(safe-area-inset-bottom, 0px))',
            borderTop: `1px solid ${T.line}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: GEIST, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', color: T.faint, textTransform: 'uppercase' }}>
                {indexLabel}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
                <span style={{ ...NUM, fontSize: 24, fontWeight: 800, color: T.ink }}>
                  {userData.handicap_index_at_time != null ? userData.handicap_index_at_time.toFixed(1) : '—'}
                </span>
                {indexMoved && handicapDelta != null && (
                  <span style={{ ...NUM, fontSize: 12, fontWeight: 800, color: deltaColor, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 9 }}>{arrow}</span>
                    {fmtDiff(handicapDelta)}
                  </span>
                )}
              </div>
            </div>

            {userData.permalink_url && (
              <a
                href={userData.permalink_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '11px 18px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  border: `1px solid ${T.line}`,
                  color: T.ink,
                  fontWeight: 800,
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none',
                  fontFamily: GEIST,
                  flexShrink: 0,
                }}
              >
                Open in MyEG
                <ExternalLink size={13} strokeWidth={2.4} />
              </a>
            )}
          </div>
        </>
      )}
    </BottomSheet>
  );
};

export default RoundDetailSheet;
