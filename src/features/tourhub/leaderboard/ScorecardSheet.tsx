/**
 * ScorecardSheet — tour leaderboard drill-in.
 *
 * Thin wrapper around the canonical CardScorecardSheet ("The Card").
 * Public surface unchanged: consumers (LeaderboardTab, FullBoardSheet,
 * MiniBoard) import ScorecardSheet + ScorecardSheetTarget and pass
 * { open, onClose, tournamentId, target }.
 */

import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
      const { data, error } = await supabase
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
  playerPhotoUrl?: string | null;
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
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { data: scRows = [], isLoading: scLoading } = useScorecard(tournamentId, target?.playerId ?? null);
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

  // The field for a pro round is the tournament field for THAT round. The
  // function gates on a minimum player count and omits holes below it, so the
  // grey line simply stops where the data stops.
  const { data: fieldRows = [], isLoading: fieldLoading } = useQuery({
    queryKey: ['tournament-hole-averages', tournamentId, selectedRound],
    enabled: !!tournamentId && selectedRound != null,
    staleTime: 60_000,
    queryFn: async (): Promise<{ hole_number: number; field_avg: number }[]> => {
      if (!tournamentId || selectedRound == null) return [];
      const { data, error } = await supabase.rpc('get_tournament_hole_averages', {
        p_tournament_id: tournamentId,
        p_round_number: selectedRound,
      });
      if (error) {
        console.error('[scorecard] field averages failed', { tournamentId, selectedRound, error });
        return [];
      }
      return (data ?? []) as { hole_number: number; field_avg: number }[];
    },
  });

  const fieldByHole = useMemo(() => {
    const m = new Map<number, number>();
    for (const r of fieldRows) {
      if (r.field_avg != null) m.set(r.hole_number, Number(r.field_avg));
    }
    return m;
  }, [fieldRows]);

  const roundHoles = useMemo(() => {
    if (selectedRound == null) return [] as Array<{ holeNo: number; par: number | null; strokes: number | null; fieldAvg?: number | null }>;
    const rows = scRows.filter((r) => r.round_number === selectedRound);
    return rows.map((r) => ({
      holeNo: r.hole_number,
      par: r.par,
      strokes: r.strokes != null && r.strokes > 0 ? r.strokes : null,
      fieldAvg: fieldByHole.get(r.hole_number) ?? null,
    }));
  }, [scRows, selectedRound, fieldByHole]);

  if (!target) {
    return (
      <CardScorecardSheet
        open={open}
        onClose={onClose}
        eyebrowText=""
        courseName=""
        holes={[]}
        playerName=""
        loading={scLoading}
      />
    );
  }



  const demoted = isDemotedStatus(target.status);
  const roundLabel = selectedRound != null
    ? t('tournament.scorecard.roundEyebrow', { round: selectedRound })
    : t('tournament.scorecard.eyebrowFallback');
  // Status token ('CUT'/'WD'/'DQ'/'MDF'/'MC'/'DNS') is golf-universal data
  // vocabulary — never keyed, matches the lexicon rule for scoring tokens.
  const statusToken = (target.status || 'CUT').toUpperCase();

  const eyebrowText = demoted
    ? `${roundLabel} ${'\u00B7'} ${statusToken}`
    : roundLabel;

  // Tournament name leads; the venue becomes the sub-line.
  const courseName =
    (meta.data?.name?.trim() || null)
    ?? meta.data?.venue_course_name
    ?? meta.data?.venue_name
    ?? t('tournament.scorecard.courseFallback');
  const courseLocation =
    [meta.data?.venue_course_name ?? meta.data?.venue_name, meta.data?.venue_city]
      .filter(Boolean).join(` ${'\u00B7'} `) || null;
  const coursePar = meta.data?.venue_par ?? null;

  const positionValue = target.position != null
    ? `${target.positionTied ? 'T' : ''}${target.position}`
    : null;

  return (
    <CardScorecardSheet
      open={open}
      onClose={onClose}
      eyebrowText={eyebrowText}
      courseName={courseName}
      courseLocation={courseLocation}
      coursePar={coursePar}
      courseSlope={null}
      holes={roundHoles}
      loading={scLoading || fieldLoading}
      surface="tour"

      heroMuted={demoted}
      rounds={availableRounds.length > 1 && selectedRound != null ? {
        available: availableRounds,
        active: selectedRound,
        onSelect: setSelectedRound,
      } : undefined}
      playerName={target.playerName}
      playerAvatarUrl={target.playerPhotoUrl ?? null}
      playerHcp={null}
      playerHcpDelta={null}
      playerUserId={target.playerId}
      identityStat={positionValue ? { label: t('tournament.scorecard.position'), value: positionValue } : null}

      onViewProfile={() => {
        onClose();
        navigate(`/tourhub/player/${target.playerId}`);
      }}
      onViewCourse={undefined}
    />
  );
}

export default ScorecardSheet;
