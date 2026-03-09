import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePrivacySettings(userId: string | undefined, initialIsPublic: boolean, initialShowHandicap: boolean) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [showHandicap, setShowHandicap] = useState(initialShowHandicap);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isUpdatingHandicap, setIsUpdatingHandicap] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    queryClient.invalidateQueries({ queryKey: ['liveClubhouseBase'] });
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
      toast({ title: 'Error', description: 'Could not update privacy setting.', variant: 'destructive' });
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
      toast({ title: 'Error', description: 'Could not update handicap setting.', variant: 'destructive' });
    } finally {
      setIsUpdatingHandicap(false);
    }
  };

  return {
    isPublic, showHandicap,
    isUpdatingPrivacy, isUpdatingHandicap,
    togglePublic, toggleHandicap,
  };
}
