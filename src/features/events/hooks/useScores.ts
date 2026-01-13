import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HoleScore {
  hole: number;
  par: number;
  strokes: number | null;
  handicapStrokes?: number;
}

export interface Score {
  id: string;
  round_id: string;
  participant_id: string;
  group_id: string | null;
  hole_scores: Record<string, number> | null;
  front_nine_gross: number | null;
  back_nine_gross: number | null;
  total_gross: number | null;
  total_net: number | null;
  stableford_points: number | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'verified';
  participant?: {
    id: string;
    user_id: string | null;
    guest_name: string | null;
    handicap_index: number | null;
    playing_handicap: number | null;
    user?: {
      display_name: string;
      profile_photo_url: string | null;
    };
  };
}

export function useRoundScores(roundId: string | null | undefined) {
  return useQuery({
    queryKey: ['round-scores', roundId],
    queryFn: async () => {
      if (!roundId) return [];

      const { data, error } = await supabase
        .from('event_scores')
        .select('*')
        .eq('round_id', roundId);

      if (error) throw error;

      // Fetch participant details for each score
      const scoresWithParticipants = await Promise.all(
        (data || []).map(async (score) => {
          const { data: participant } = await supabase
            .from('event_participants')
            .select('id, user_id, guest_name, handicap_index, playing_handicap')
            .eq('id', score.participant_id)
            .single();

          let user = null;
          if (participant?.user_id) {
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('display_name, profile_photo_url')
              .eq('id', participant.user_id)
              .single();
            user = userData;
          }

          return {
            ...score,
            participant: participant ? { ...participant, user } : null,
          } as Score;
        })
      );

      return scoresWithParticipants;
    },
    enabled: !!roundId,
  });
}

export function useMyScore(roundId: string | null | undefined, participantId: string | null | undefined) {
  return useQuery({
    queryKey: ['my-score', roundId, participantId],
    queryFn: async () => {
      if (!roundId || !participantId) return null;

      const { data, error } = await supabase
        .from('event_scores')
        .select('*')
        .eq('round_id', roundId)
        .eq('participant_id', participantId)
        .maybeSingle();

      if (error) throw error;
      return data as Score | null;
    },
    enabled: !!roundId && !!participantId,
  });
}

export function useCreateScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roundId,
      participantId,
      groupId,
    }: {
      roundId: string;
      participantId: string;
      groupId?: string;
    }) => {
      const { data, error } = await supabase
        .from('event_scores')
        .insert({
          round_id: roundId,
          participant_id: participantId,
          group_id: groupId || null,
          status: 'not_started',
          hole_scores: {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['round-scores', data.round_id] });
      queryClient.invalidateQueries({ queryKey: ['my-score'] });
    },
  });
}

export function useUpdateHoleScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scoreId,
      hole,
      strokes,
      roundId,
    }: {
      scoreId: string;
      hole: number;
      strokes: number | null;
      roundId: string;
    }) => {
      // Get current score
      const { data: currentScore } = await supabase
        .from('event_scores')
        .select('hole_scores')
        .eq('id', scoreId)
        .single();

      const holeScores = { ...((currentScore?.hole_scores as Record<string, number>) || {}) };
      
      if (strokes !== null) {
        holeScores[hole.toString()] = strokes;
      } else {
        delete holeScores[hole.toString()];
      }

      // Calculate totals
      const frontNine = [1,2,3,4,5,6,7,8,9].reduce((sum, h) => sum + (holeScores[h.toString()] || 0), 0);
      const backNine = [10,11,12,13,14,15,16,17,18].reduce((sum, h) => sum + (holeScores[h.toString()] || 0), 0);
      const totalGross = frontNine + backNine;

      const { data, error } = await supabase
        .from('event_scores')
        .update({
          hole_scores: holeScores,
          front_nine_gross: frontNine || null,
          back_nine_gross: backNine || null,
          total_gross: totalGross || null,
          status: Object.keys(holeScores).length > 0 ? 'in_progress' : 'not_started',
          updated_at: new Date().toISOString(),
        })
        .eq('id', scoreId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, roundId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['round-scores', data.roundId] });
      queryClient.invalidateQueries({ queryKey: ['my-score'] });
      queryClient.invalidateQueries({ queryKey: ['event-leaderboard'] });
    },
  });
}

export function useCompleteScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scoreId,
      roundId,
      playingHandicap,
      pars,
    }: {
      scoreId: string;
      roundId: string;
      playingHandicap: number;
      pars: number[];
    }) => {
      const { data: score } = await supabase
        .from('event_scores')
        .select('hole_scores, total_gross')
        .eq('id', scoreId)
        .single();

      if (!score?.hole_scores) throw new Error('No scores to complete');

      const holeScores = score.hole_scores as Record<string, number>;

      // Calculate net and stableford
      let stablefordPoints = 0;

      // Distribute handicap strokes across holes (simplified - strokes go to hardest holes first)
      const handicapStrokes = Math.round(playingHandicap);
      const strokesPerHole = Array(18).fill(0);
      for (let i = 0; i < handicapStrokes && i < 36; i++) {
        strokesPerHole[i % 18]++;
      }

      for (let hole = 1; hole <= 18; hole++) {
        const strokes = holeScores[hole.toString()] || 0;
        const par = pars[hole - 1] || 4;
        const hcpStrokes = strokesPerHole[hole - 1];
        
        const netStrokes = strokes - hcpStrokes;
        const diff = netStrokes - par;
        
        // Stableford points
        if (diff <= -3) stablefordPoints += 5;
        else if (diff === -2) stablefordPoints += 4;
        else if (diff === -1) stablefordPoints += 3;
        else if (diff === 0) stablefordPoints += 2;
        else if (diff === 1) stablefordPoints += 1;
      }

      const totalNet = (score.total_gross || 0) - handicapStrokes;

      const { data, error } = await supabase
        .from('event_scores')
        .update({
          total_net: totalNet,
          stableford_points: stablefordPoints,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', scoreId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, roundId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['round-scores', data.roundId] });
      queryClient.invalidateQueries({ queryKey: ['event-leaderboard'] });
      toast.success('Score submitted!');
    },
  });
}

export function useEventLeaderboard(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ['event-leaderboard', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_leaderboard')
        .select('*')
        .eq('event_id', eventId)
        .order('position_stableford', { ascending: true });

      if (error) throw error;

      // Fetch participant details
      const leaderboardWithDetails = await Promise.all(
        (data || []).map(async (entry) => {
          const { data: participant } = await supabase
            .from('event_participants')
            .select('id, user_id, guest_name, handicap_index')
            .eq('id', entry.participant_id)
            .single();

          let user = null;
          if (participant?.user_id) {
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('display_name, profile_photo_url')
              .eq('id', participant.user_id)
              .single();
            user = userData;
          }

          return {
            ...entry,
            participant: participant ? { ...participant, user } : null,
          };
        })
      );

      return leaderboardWithDetails;
    },
    enabled: !!eventId,
  });
}
