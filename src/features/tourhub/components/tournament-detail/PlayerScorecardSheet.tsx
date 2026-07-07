import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import CountryFlag from '@/components/ui/country-flag';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { SCORECARD_LIGHT } from '@/features/courses/_shared/scorecard/scorecardTheme';
import { TrajectoryLine, type TrajectoryHole } from '@/features/courses/_shared/scorecard/TrajectoryLine';
import { NineGrid } from '@/features/courses/_shared/scorecard/NineGrid';
import { playerRoute } from '../../routes';
import {
  useTournamentScorecard,
  type ScorecardHole,
  type RoundScorecard,
} from '../../hooks/useTournamentScorecard';

const T = SCORECARD_LIGHT;
const AMBER = '#F7931E';
const INK = T.ink;
const INK_MUTE = T.faint;
const GEIST = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const NUM: React.CSSProperties = {
  fontFamily: GEIST,
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"zero" 0',
};


function fmtRel(n: number | null, played: boolean): string {
  if (!played || n == null) return '—';
  return n === 0 ? 'E' : n < 0 ? `\u2212${Math.abs(n)}` : `+${n}`;
}

function sumStp(holes: ScorecardHole[], from: number, to: number): number {
  return holes
    .slice(from, to)
    .reduce((a, h) => a + (h.scoreToPar ?? 0), 0);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toTrajectory(holes: ScorecardHole[]): TrajectoryHole[] {
  return holes.map((h) => ({
    holeNo: h.hole,
    par: h.par ?? null,
    strokes: h.strokes ?? null,
  }));
}


export interface PlayerScorecardSheetProps {
  open: boolean;
  onClose: () => void;
  tournamentId: string;
  tournamentStatus?: string;
  tournamentName?: string;
  currentRound?: number | null;
  player: {
    id: string;
    name: string;
    countryCode?: string | null;
    position?: number | null;
    positionTied?: boolean;
    totalScore?: number | null;
    photoCandidates?: (string | null | undefined)[];
  };
}

export function PlayerScorecardSheet({
  open,
  onClose,
  tournamentId,
  tournamentStatus,
  tournamentName,
  currentRound,
  player,
}: PlayerScorecardSheetProps) {
  const navigate = useNavigate();
  const isLive = tournamentStatus === 'inprogress';

  // Two-phase live: first fetch any data (no polling), then poll only when the
  // selected round is the current in-progress round.
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const { data: rounds, isLoading } = useTournamentScorecard(
    open ? tournamentId : null,
    open ? player.id : null,
    { live: isLive && selectedRound != null && selectedRound === currentRound },
  );

  // Default selected round
  useEffect(() => {
    if (!open || !rounds || rounds.length === 0) return;
    if (selectedRound != null && rounds.some((r) => r.round === selectedRound)) return;
    if (isLive && currentRound && rounds.some((r) => r.round === currentRound)) {
      setSelectedRound(currentRound);
      return;
    }
    const played = rounds.filter((r) => r.played).map((r) => r.round);
    setSelectedRound(played.length ? Math.max(...played) : rounds[0].round);
  }, [open, rounds, isLive, currentRound, selectedRound]);

  // Reset when sheet closes/player changes
  useEffect(() => {
    if (!open) setSelectedRound(null);
  }, [open, player.id]);

  const roundMap = useMemo(() => {
    const m = new Map<number, RoundScorecard>();
    (rounds ?? []).forEach((r) => m.set(r.round, r));
    return m;
  }, [rounds]);

  const selected = selectedRound != null ? roundMap.get(selectedRound) : undefined;
  const isSelectedLive =
    !!selected && isLive && currentRound != null && selectedRound === currentRound &&
    selected.thru < selected.holes.length;
  const roundRel = selected?.played ? sumStp(selected.holes, 0, selected.thru) : null;

  const posLabel =
    player.position === 1 ? 'LEADER' :
    player.position != null ? `${player.positionTied ? 'T' : 'POS '}${player.position}` :
    'PLAYER';

  const handleVisitProfile = () => {
    onClose();
    const target = playerRoute(player.id, tournamentName ? { kind: 'tournament', tournamentName } : undefined);
    navigate(target.to, { state: target.state });
  };

  const hasAnyData = (rounds?.length ?? 0) > 0;

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="player-scorecard-title">
      {/* player header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px 14px', borderBottom: '1px solid #F1F3F5' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <SquircleAvatar
            srcCandidates={player.photoCandidates}
            alt={player.name}
            fallback={initialsOf(player.name)}
            userId={player.id}
            size={44}
            hairlineRing ringColor={LIGHT_HAIRLINE}
          />
          {player.countryCode && (
            <div style={{ position: 'absolute', bottom: -2, right: -2, borderRadius: '50%', overflow: 'hidden' }}>
              <CountryFlag country={player.countryCode} size="sm" />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ ...NUM, fontSize: 11, fontWeight: 800, color: AMBER, letterSpacing: '0.06em' }}>{posLabel}</span>
            {player.totalScore != null && (
              <>
                <span style={{ fontSize: 11, color: '#CBD5E1' }}>·</span>
                <span style={{ ...NUM, fontSize: 11, fontWeight: 700, color: '#0F6E56' }}>
                  {fmtRel(player.totalScore, true)} total
                </span>
              </>
            )}
          </div>
          <div id="player-scorecard-title" style={{ fontFamily: GEIST, fontSize: 18, fontWeight: 800, color: INK, letterSpacing: '-0.01em', marginTop: 1 }}>
            {player.name}
          </div>
        </div>
      </div>

      {/* round tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 18px 10px' }}>
        {[1, 2, 3, 4].map((rn) => {
          const rr = roundMap.get(rn);
          const active = rn === selectedRound;
          const isLiveRound = isLive && currentRound === rn;
          const disabled = !rr?.played && !isLiveRound;
          return (
            <button
              key={rn}
              onClick={() => !disabled && setSelectedRound(rn)}
              disabled={disabled}
              style={{
                flex: 1, height: 36, borderRadius: 10, border: 'none',
                cursor: disabled ? 'default' : 'pointer',
                background: active ? INK : disabled ? '#F8FAFC' : '#F1F3F5',
                color: active ? '#fff' : disabled ? '#CBD5E1' : '#475569',
                fontFamily: GEIST, fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              R{rn}
              {isLiveRound && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#34D399' : '#10B981' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* round summary bar */}
      {selected && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSelectedLive ? (
              <>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 7px #10B981' }} />
                <span style={{ ...NUM, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#0F6E56' }}>
                  LIVE · THRU {selected.thru}
                </span>
              </>
            ) : (
              <span style={{ ...NUM, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: T.dim }}>
                ROUND {selected.round}{selected.thru >= selected.holes.length ? ' · COMPLETE' : ''}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: T.dim }}>ROUND</span>
            <span style={{ ...NUM, fontSize: 18, fontWeight: 800, color: roundRel == null ? T.ink : roundRel < 0 ? T.under : roundRel > 0 ? T.over : T.ink }}>
              {fmtRel(roundRel, selected.played)}
            </span>
          </div>
        </div>
      )}

      {/* trajectory */}
      {selected && selected.played && (() => {
        const holesToUse = isSelectedLive ? selected.holes.slice(0, selected.thru) : selected.holes;
        const traj = toTrajectory(holesToUse);
        if (traj.filter((h) => h.par != null && h.strokes != null).length < 2) return null;
        return (
          <div style={{ padding: '0 16px 6px' }}>
            <div style={{
              fontFamily: GEIST, fontSize: 9, fontWeight: 800,
              color: T.faint, letterSpacing: '0.12em', marginBottom: 6,
            }}>
              ROUND {selected.round} · THE SHAPE
            </div>
            <TrajectoryLine holes={traj} surface="light" theme={T} />
          </div>
        );
      })()}

      {/* body */}
      {isLoading ? (
        <div style={{ padding: '30px 18px 40px', textAlign: 'center', color: INK_MUTE, fontSize: 13 }}>
          Loading scorecard…
        </div>
      ) : !hasAnyData ? (
        <div style={{ padding: '30px 18px 40px', textAlign: 'center', color: INK_MUTE, fontSize: 13 }}>
          Hole-by-hole scorecard isn't available for this tour.
        </div>
      ) : selected && selected.played ? (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 15 }}>
          <NineGrid holes={toTrajectory(selected.holes.slice(0, 9))} label="OUT" startAt={1} surface="light" theme={T} />
          <NineGrid holes={toTrajectory(selected.holes.slice(9, 18))} label="IN" startAt={10} surface="light" theme={T} />
        </div>
      ) : (
        <div style={{ padding: '30px 18px 40px', textAlign: 'center', color: INK_MUTE, fontSize: 13 }}>
          Round {selectedRound} hasn't started yet.
        </div>
      )}



      {/* visit profile CTA */}
      <div style={{
        padding: '14px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
        borderTop: '1px solid #F1F3F5',
      }}>
        <button
          onClick={handleVisitProfile}
          style={{
            width: '100%', height: 46, borderRadius: 12, border: '1px solid #E2E8F0', background: '#fff',
            fontFamily: GEIST, fontSize: 14, fontWeight: 700, color: INK, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          className="active:opacity-70 transition-opacity"
        >
          Visit {player.name.split(' ').slice(-1)[0]}'s profile
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </BottomSheet>
  );
}

export default PlayerScorecardSheet;
