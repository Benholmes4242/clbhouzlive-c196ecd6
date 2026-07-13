/**
 * ScorecardSheet -- tour leaderboard drill-in.
 *
 * Thin wrapper around the canonical CardScorecardSheet ("The Card").
 * Public surface is intentionally unchanged: consumers (LeaderboardTab,
 * FullBoardSheet, MiniBoard) import ScorecardSheet + ScorecardSheetTarget
 * and pass { open, onClose, tournamentId, target }. Reads the same
 * sr_scorecards select as before; no new columns.
 */

import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CardScorecardSheet } from '@/features/courses/_shared/scorecard/CardScorecardSheet';
import { useTournamentMeta } from './useTournamentMeta';

interface ScorecardRow {
  round_number: number;
  hole_number: number;
  strokes: number | null;
  par: number | null;
  score_to_par: number | null;
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

function isDemotedStatus(s?: string | null): boolean {
  if (!s) return false;
  const u = s.toUpperCase();
  return u === 'MC' || u === 'CUT' || u === 'WD' || u === 'DQ' || u === 'MDF' || u === 'DNS';
}

export function ScorecardSheet({ open, onClose, tournamentId, target }: Props) {
  const navigate = useNavigate();
  const { data: scRows = [] } = useScorecard(tournamentId, target?.playerId ?? null);
  const meta = useTournamentMeta(tournamentId);

  const availableRounds = useMemo(() => {
    const set = new Set<number>();
    for (const r of scRows) {
      if (r.strokes != null && r.strokes > 0) set.add(r.round_number);
    }
    return [...set].sort((a, b) => a - b);
  }, [scRows]);

  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  useEffect(() => {
    if (availableRounds.length === 0) { setSelectedRound(null); return; }
    const latest = availableRounds[availableRounds.length - 1];
    setSelectedRound((prev) =>
      prev != null && availableRounds.includes(prev) ? prev : latest,
    );
  }, [availableRounds]);

  const roundHoles = useMemo(() => {
    if (selectedRound == null) return [] as Array<{ holeNo: number; par: number | null; strokes: number | null }>;
    const rows = scRows.filter((r) => r.round_number === selectedRound);
    return rows.map((r) => ({
      holeNo: r.hole_number,
      par: r.par,
      strokes: r.strokes != null && r.strokes > 0 ? r.strokes : null,
    }));
  }, [scRows, selectedRound]);

  const grossPar = useMemo(() => {
    let gross = 0;
    let par = 0;
    let played = false;
    for (const h of roundHoles) {
      if (h.strokes != null && h.par != null) {
        gross += h.strokes;
        par += h.par;
        played = true;
      }
    }
    return { gross, par, played };
  }, [roundHoles]);

  if (!target) {
    return (
      <CardScorecardSheet
        open={open}
        onClose={onClose}
        eyebrowText=""
        name=""
        subLine=""
        holes={[]}
      />
    );
  }

  const demoted = isDemotedStatus(target.status);
  const tournamentName = meta.data?.name?.trim() || null;
  const roundLabel = selectedRound != null ? `ROUND ${selectedRound}` : 'SCORECARD';
  const eyebrowText = demoted
    ? `${roundLabel} ${'\u00B7'} ${(target.status || 'CUT').toUpperCase()}`
    : tournamentName
      ? `${roundLabel} ${'\u00B7'} ${tournamentName}`
      : roundLabel;

  const subLine = grossPar.played
    ? `Gross ${grossPar.gross} ${'\u00B7'} Par ${grossPar.par}`
    : `Par ${grossPar.par || '\u2014'}`;

  return (
    <CardScorecardSheet
      open={open}
      onClose={onClose}
      eyebrowText={eyebrowText}
      name={target.playerName}
      onIdentityTap={() => {
        onClose();
        navigate(`/tourhub/player/${target.playerId}`);
      }}
      subLine={subLine}
      holes={roundHoles}
      heroMuted={demoted}
      rounds={availableRounds.length > 1 && selectedRound != null ? {
        available: availableRounds,
        active: selectedRound,
        onSelect: setSelectedRound,
      } : undefined}
    />
  );
}

export default ScorecardSheet;
