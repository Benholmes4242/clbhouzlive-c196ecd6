import React, { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useRoundDetail } from '@/lib/whs/hooks';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useProfileData } from '@/hooks/useProfileData';
import type { WhsScoreHole } from '@/lib/whs/types';

// ─── Tokens (mirror PlayerScorecardSheet) ────────────────────────────────
const INK = '#0F172A';
const INK_MUTE = '#94A3B8';
const PINE = '#2F6B4F';
const CLAY = '#B5703C';
const AMBER_BROWN = '#B26818';
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
  /** Kept for back-compat. Ignored — sheet is always the unified light surface. */
  variant?: 'dark' | 'light';
}

// ─── Helpers ─────────────────────────────────────────────────────────────
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
  // Parse YYYY-MM-DD as local to avoid TZ drift
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dow = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
  const day = d.getDate();
  const mon = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  return `${dow}, ${day} ${mon}`;
}

// ─── Hole cell (ScoreMark, identical layout to tour sheet) ───────────────
function HoleCell({ h }: { h: WhsScoreHole }) {
  const s = strokesOf(h);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <div style={{ ...NUM, fontSize: 9, fontWeight: 700, color: INK_MUTE }}>{h.hole_no}</div>
      <div style={{ ...NUM, fontSize: 9, fontWeight: 600, color: '#CBD5E1' }}>{h.par ?? '-'}</div>
      <ScoreMark strokes={s} par={h.par ?? 4} size={28} fontFamily={GEIST} />
    </div>
  );
}

function Nine({ holes, label }: { holes: WhsScoreHole[]; label: 'OUT' | 'IN' }) {
  const totalPar = holes.reduce((a, h) => a + (h.par ?? 0), 0);
  const totalStrokes = holes.reduce((a, h) => {
    const s = strokesOf(h);
    return a + (s ?? 0);
  }, 0);
  const anyPlayed = holes.some((h) => strokesOf(h) != null);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
      <div style={{ display: 'flex', flex: 1, gap: 2 }}>
        {holes.map((h) => <HoleCell key={h.hole_no} h={h} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 34, flexShrink: 0 }}>
        <div style={{ ...NUM, fontSize: 9, fontWeight: 800, color: INK, letterSpacing: '0.04em' }}>{label}</div>
        <div style={{ ...NUM, fontSize: 9, fontWeight: 600, color: '#CBD5E1' }}>{totalPar || '-'}</div>
        <div style={{
          width: 30, height: 26, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...NUM, fontSize: 13, fontWeight: 800, color: anyPlayed ? INK : '#E2E8F0',
        }}>
          {anyPlayed ? totalStrokes : '·'}
        </div>
      </div>
    </div>
  );
}

// ─── Stat tile ───────────────────────────────────────────────────────────
function StatTile({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div style={{
      flex: 1,
      background: '#F8FAFC',
      border: '1px solid #EEF1F4',
      borderRadius: 11,
      padding: '9px 6px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      minWidth: 0,
    }}>
      <span style={{ ...NUM, fontSize: 18, fontWeight: 800, color: INK, lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: GEIST, fontSize: 8, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────
const SheetSkeleton: React.FC = () => (
  <div style={{ padding: '8px 18px 18px' }} className="animate-pulse">
    <div style={{ height: 12, width: 120, background: '#EEF1F4', borderRadius: 4, marginTop: 6 }} />
    <div style={{ height: 22, width: '70%', background: '#EEF1F4', borderRadius: 4, marginTop: 10 }} />
    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
      <div style={{ flex: 1, height: 52, background: '#F1F3F5', borderRadius: 11 }} />
      <div style={{ flex: 1, height: 52, background: '#F1F3F5', borderRadius: 11 }} />
      <div style={{ flex: 1, height: 52, background: '#F1F3F5', borderRadius: 11 }} />
    </div>
    <div style={{ height: 140, background: '#F1F3F5', borderRadius: 10, marginTop: 18 }} />
  </div>
);

const SheetEmpty: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: GEIST }}>
    <p style={{ margin: '0 0 8px', fontSize: 14, color: INK_MUTE }}>No round to show yet.</p>
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

// ─── Component ───────────────────────────────────────────────────────────
export const RoundDetailSheet: React.FC<Props> = ({ open, onClose, scoreId, handicapDelta }) => {
  const userQuery = useRoundDetail(scoreId, open);
  const userData = userQuery.data;
  const userLoading = userQuery.isLoading;
  const { profile } = useProfileData();

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

  const previousIndex =
    userData && handicapDelta != null && userData.handicap_index_at_time != null
      ? userData.handicap_index_at_time - handicapDelta
      : null;

  const indexMoved = handicapDelta != null && Math.abs(handicapDelta) >= 0.05 && previousIndex != null;

  // Sort holes & derive front/back nine
  const sortedHoles = useMemo(() => {
    if (!userData?.holes) return [] as WhsScoreHole[];
    return [...userData.holes].sort((a, b) => a.hole_no - b.hole_no);
  }, [userData]);
  const front9 = sortedHoles.filter((h) => h.hole_no <= 9);
  const back9 = userData?.is_nine_hole ? [] : sortedHoles.filter((h) => h.hole_no > 9);
  const hasHoles = sortedHoles.length > 0;

  // Round totals
  const totalStrokes = sortedHoles.reduce((a, h) => a + (strokesOf(h) ?? 0), 0);
  const totalPar = sortedHoles.reduce((a, h) => a + (h.par ?? 0), 0);
  const holesPlayed = sortedHoles.filter((h) => strokesOf(h) != null).length;
  const totalHolesExpected = userData?.is_nine_hole ? 9 : 18;
  const isComplete = holesPlayed >= totalHolesExpected;
  const roundRel = hasHoles && holesPlayed > 0 ? totalStrokes - totalPar : null;

  // Legend Ace/Albatross detection
  const hasAce = sortedHoles.some((h) => strokesOf(h) === 1);
  const hasAlbatross = sortedHoles.some((h) => {
    const s = strokesOf(h);
    return s != null && h.par != null && (s - h.par) <= -3 && s !== 1;
  });

  const dateEyebrow = fmtDateEyebrow(userData?.play_date);
  const courseName = userData?.course?.name ?? 'Unknown course';
  const nineLabel = userData?.is_nine_hole ? ' · 9 holes' : '';

  const indexLabel = indexMoved ? 'INDEX AFTER THIS ROUND' : 'CURRENT INDEX';
  // Down (negative delta) = improvement = pine; Up = clay
  const deltaColor = handicapDelta == null ? INK_MUTE : handicapDelta < 0 ? PINE : CLAY;
  const arrow = handicapDelta == null ? '' : handicapDelta < 0 ? '▼' : '▲';

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="round-detail-sheet-title">
      {userLoading ? (
        <SheetSkeleton />
      ) : !userData ? (
        <SheetEmpty onClose={onClose} />
      ) : (
        <>
          {/* Identity row — avatar + viewer name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 6px' }}>
            <SquircleAvatar
              src={profile?.profile_photo_url ?? undefined}
              alt={profile?.display_name ?? ''}
              userId={profile?.id ?? null}
              size={46}
              hideRing
            />
            <div
              style={{
                fontFamily: GEIST,
                fontSize: 19,
                fontWeight: 800,
                color: INK,
                letterSpacing: '-0.01em',
              }}
            >
              {profile?.display_name ?? 'You'}
            </div>
          </div>

          {/* Header — date eyebrow + course name + GROSS/STABLEFORD/DIFF tiles */}
          <div style={{ padding: '8px 18px 14px', borderBottom: '1px solid #F1F3F5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              {dateEyebrow && (
                <span style={{ ...NUM, fontSize: 11, fontWeight: 800, color: AMBER_BROWN, letterSpacing: '0.04em' }}>
                  {dateEyebrow}
                </span>
              )}
              {(parTotal != null || userData.slope_rating != null) && (
                <>
                  {dateEyebrow && <span style={{ fontSize: 11, color: '#CBD5E1' }}>·</span>}
                  <span style={{ ...NUM, fontSize: 11, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.04em' }}>
                    {parTotal != null ? `PAR ${parTotal}` : ''}
                    {parTotal != null && userData.slope_rating != null ? ' · ' : ''}
                    {userData.slope_rating != null ? `SLOPE ${userData.slope_rating}` : ''}
                  </span>
                </>
              )}
            </div>
            <div
              id="round-detail-sheet-title"
              style={{ fontFamily: GEIST, fontSize: 18, fontWeight: 800, color: INK, letterSpacing: '-0.01em' }}
            >
              {courseName}{nineLabel}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <StatTile value={userData.adjusted_gross ?? '—'} label="GROSS" />
              <StatTile value={userData.stableford_points ?? '—'} label="STABLEFORD" />
              <StatTile value={fmtDiff(userData.handicap_differential)} label="SCORE DIFF" />
            </div>
          </div>

          {/* Round summary bar */}
          {hasHoles && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 10px' }}>
              <span style={{ ...NUM, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: INK_MUTE }}>
                {holesPlayed} {holesPlayed === 1 ? 'HOLE' : 'HOLES'}{isComplete ? ' · COMPLETE' : ''}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: INK_MUTE }}>ROUND</span>
                <span style={{
                  ...NUM, fontSize: 18, fontWeight: 800,
                  color: roundRel == null ? INK : roundRel < 0 ? PINE : roundRel > 0 ? CLAY : INK,
                }}>
                  {fmtRel(roundRel)}
                </span>
              </div>
            </div>
          )}

          {/* Body — Nine grid(s) or syncing/empty */}
          {hasHoles ? (
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Nine holes={front9} label="OUT" />
              {!userData.is_nine_hole && back9.length > 0 && <Nine holes={back9} label="IN" />}
            </div>
          ) : (
            <div style={{ padding: '30px 18px 40px', textAlign: 'center', color: INK_MUTE, fontSize: 13, fontFamily: GEIST }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                {userData.hole_by_hole_fetched
                  ? 'No hole-by-hole data for this round.'
                  : 'Hole data is still syncing'}
              </div>
              {!userData.hole_by_hole_fetched && (
                <div style={{ fontSize: 12, color: INK_MUTE }}>Check back in a few hours.</div>
              )}
            </div>
          )}

          {/* Legend — conditional Ace/Albatross */}
          {hasHoles && (() => {
            const keyItems: Array<[string, number, number]> = [
              ...(hasAce ? [['Ace', 1, 4] as [string, number, number]] : []),
              ...(hasAlbatross ? [['Albatross', 2, 5] as [string, number, number]] : []),
              ['Eagle',  2, 4],
              ['Birdie', 3, 4],
              ['Par',    4, 4],
              ['Bogey',  5, 4],
              ['Dbl+',   6, 4],
            ];
            return (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, padding: '4px 18px 14px', flexWrap: 'wrap' }}>
                {keyItems.map(([lbl, strokes, par]) => (
                  <div key={lbl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <ScoreMark strokes={strokes} par={par} size={22} fontFamily={GEIST} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: INK_MUTE, textAlign: 'center', fontFamily: GEIST }}>{lbl}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Footer — index movement + Open in MyEG */}
          <div style={{
            padding: '14px 18px calc(8px + env(safe-area-inset-bottom, 0px))',
            borderTop: '1px solid #F1F3F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: GEIST, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: INK_MUTE, textTransform: 'uppercase' }}>
                {indexLabel}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
                <span style={{ ...NUM, fontSize: 20, fontWeight: 800, color: INK }}>
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
                  padding: '9px 16px',
                  borderRadius: 999,
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 12.5,
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
