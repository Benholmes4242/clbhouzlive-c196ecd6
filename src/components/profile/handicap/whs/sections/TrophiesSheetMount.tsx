import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAllScores, useHandicapHistory, useTrophyAggregates } from '@/lib/whs/hooks';
import { computeAchievements } from '@/lib/whs/achievements';
import type { Achievement } from '@/lib/whs/types';
import AllTrophiesSheet from './AllTrophiesSheet';
import { subscribeOpenTrophies } from '../trophiesSheetEvents';

interface Props {
  connectionId: string;
  connectionCreatedAt: string | null;
  userId?: string;
}

/**
 * Mounts the AllTrophiesSheet and listens to the global openTrophiesSheet
 * event so any UI surface (page top-bar Trophy icon, HeroHandicapCard
 * "View N trophies →" link) can open the same sheet without prop-drilling.
 */
export const TrophiesSheetMount: React.FC<Props> = ({
  connectionId,
  connectionCreatedAt,
  userId,
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeOpenTrophies(() => setOpen(true)), []);

  const { data: scores } = useAllScores(connectionId);
  const { data: history } = useHandicapHistory(connectionId, 365);
  const { data: aggregates } = useTrophyAggregates(userId, connectionId);

  const { data: primaryClub } = useQuery({
    queryKey: ['user-primary-club', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('primary_club_id')
        .eq('id', userId!)
        .maybeSingle();
      const primaryClubId = (profileRow as any)?.primary_club_id ?? null;
      if (!primaryClubId) {
        return { primary_club_id: null as string | null, primary_club_name: null as string | null };
      }
      const { data: club } = await supabase
        .from('golf_clubs')
        .select('id, name')
        .eq('id', primaryClubId)
        .maybeSingle();
      return {
        primary_club_id: primaryClubId as string,
        primary_club_name: ((club as any)?.name ?? null) as string | null,
      };
    },
    staleTime: 5 * 60_000,
  });

  const allAchievements = useMemo<Achievement[]>(() => {
    if (!scores || !history) return [];
    return computeAchievements({
      scores,
      history,
      connectionCreatedAt,
      primaryClubId: primaryClub?.primary_club_id ?? null,
      primaryClubName: primaryClub?.primary_club_name ?? null,
      aggregates: aggregates ?? null,
    });
  }, [scores, history, connectionCreatedAt, primaryClub, aggregates]);

  return (
    <AllTrophiesSheet
      open={open}
      onClose={() => setOpen(false)}
      achievements={allAchievements}
    />
  );
};

export default TrophiesSheetMount;
