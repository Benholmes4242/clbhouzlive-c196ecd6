import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePrivacySettings(
  userId: string | undefined,
  initialIsPublic: boolean,
  initialShowHandicap: boolean,
  initialShowInHandicapLeaderboards: boolean,
  initialShowInExplorationLeaderboards: boolean,
) {
  const queryClient = useQueryClient();

  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [showHandicap, setShowHandicap] = useState(initialShowHandicap);
  const [showInHandicapLeaderboards, setShowInHandicapLeaderboards] = useState(initialShowInHandicapLeaderboards);
  const [showInExplorationLeaderboards, setShowInExplorationLeaderboards] = useState(initialShowInExplorationLeaderboards);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isUpdatingHandicap, setIsUpdatingHandicap] = useState(false);
  const [isUpdatingHandicapLb, setIsUpdatingHandicapLb] = useState(false);
  const [isUpdatingExplorationLb, setIsUpdatingExplorationLb] = useState(false);

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

  const toggleHandicap = async (value: boolean) => {
    if (!userId) return;
    setIsUpdatingHandicap(true);
    const prev = showHandicap;
    setShowHandicap(value);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ show_handicap: value })
        .eq('id', userId);
      if (error) throw error;
      invalidate();
    } catch {
      setShowHandicap(prev);
      toast.error('Could not update handicap setting.');
    } finally {
      setIsUpdatingHandicap(false);
    }
  };

  const toggleHandicapLeaderboards = async (value: boolean) => {
    if (!userId) return;
    setIsUpdatingHandicapLb(true);
    const prev = showInHandicapLeaderboards;
    setShowInHandicapLeaderboards(value);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ show_in_handicap_leaderboards: value } as any)
        .eq('id', userId);
      if (error) throw error;
      invalidate();
    } catch {
      setShowInHandicapLeaderboards(prev);
      toast.error('Could not update leaderboard setting.');
    } finally {
      setIsUpdatingHandicapLb(false);
    }
  };

  const toggleExplorationLeaderboards = async (value: boolean) => {
    if (!userId) return;
    setIsUpdatingExplorationLb(true);
    const prev = showInExplorationLeaderboards;
    setShowInExplorationLeaderboards(value);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ show_in_exploration_leaderboards: value } as any)
        .eq('id', userId);
      if (error) throw error;
      invalidate();
    } catch {
      setShowInExplorationLeaderboards(prev);
      toast.error('Could not update leaderboard setting.');
    } finally {
      setIsUpdatingExplorationLb(false);
    }
  };

  return {
    isPublic, showHandicap,
    showInHandicapLeaderboards, showInExplorationLeaderboards,
    isUpdatingPrivacy, isUpdatingHandicap,
    isUpdatingHandicapLb, isUpdatingExplorationLb,
    togglePublic, toggleHandicap,
    toggleHandicapLeaderboards, toggleExplorationLeaderboards,
  };
}
