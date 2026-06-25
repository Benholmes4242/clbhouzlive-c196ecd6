import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type VisibilityLevel = 'public' | 'friends' | 'private';

function coerceLevel(v: unknown, fallback: VisibilityLevel = 'public'): VisibilityLevel {
  return v === 'public' || v === 'friends' || v === 'private' ? v : fallback;
}

export function usePrivacySettings(
  userId: string | undefined,
  initialIsPublic: boolean,
  initialHandicapVisibility: VisibilityLevel = 'public',
  initialLeaderboardVisibility: VisibilityLevel = 'public',
) {
  const queryClient = useQueryClient();

  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [handicapVisibility, setHandicapVisibility] = useState<VisibilityLevel>(initialHandicapVisibility);
  const [leaderboardVisibility, setLeaderboardVisibility] = useState<VisibilityLevel>(initialLeaderboardVisibility);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isUpdatingHandicapVisibility, setIsUpdatingHandicapVisibility] = useState(false);
  const [isUpdatingLeaderboardVisibility, setIsUpdatingLeaderboardVisibility] = useState(false);

  useEffect(() => { setIsPublic(initialIsPublic); }, [initialIsPublic]);
  useEffect(() => { setHandicapVisibility(initialHandicapVisibility); }, [initialHandicapVisibility]);
  useEffect(() => { setLeaderboardVisibility(initialLeaderboardVisibility); }, [initialLeaderboardVisibility]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    queryClient.invalidateQueries({ queryKey: ['liveClubhouseBase'] });
    queryClient.invalidateQueries({ queryKey: ['lowest-handicap-leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['handicap-improvement-leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['season-improvement-leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['exploration-leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['countries-leaderboard'] });
  };

  const togglePublic = async (value: boolean) => {
    if (!userId) return;
    setIsUpdatingPrivacy(true);
    const prev = isPublic;
    setIsPublic(value);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_public: value })
        .eq('id', userId);
      if (error) throw error;
      invalidate();
    } catch {
      setIsPublic(prev);
      toast.error('Could not update privacy setting.');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const setHandicapVisibilityLevel = async (value: VisibilityLevel) => {
    if (!userId) return;
    const next = coerceLevel(value);
    setIsUpdatingHandicapVisibility(true);
    const prev = handicapVisibility;
    setHandicapVisibility(next);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ handicap_visibility: next } as any)
        .eq('id', userId);
      if (error) throw error;
      invalidate();
    } catch {
      setHandicapVisibility(prev);
      toast.error('Could not update handicap visibility.');
    } finally {
      setIsUpdatingHandicapVisibility(false);
    }
  };

  const setLeaderboardVisibilityLevel = async (value: VisibilityLevel) => {
    if (!userId) return;
    const next = coerceLevel(value);
    setIsUpdatingLeaderboardVisibility(true);
    const prev = leaderboardVisibility;
    setLeaderboardVisibility(next);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ leaderboard_visibility: next } as any)
        .eq('id', userId);
      if (error) throw error;
      invalidate();
    } catch {
      setLeaderboardVisibility(prev);
      toast.error('Could not update leaderboard visibility.');
    } finally {
      setIsUpdatingLeaderboardVisibility(false);
    }
  };

  return {
    isPublic,
    handicapVisibility,
    leaderboardVisibility,
    isUpdatingPrivacy,
    isUpdatingHandicapVisibility,
    isUpdatingLeaderboardVisibility,
    togglePublic,
    setHandicapVisibilityLevel,
    setLeaderboardVisibilityLevel,
  };
}
