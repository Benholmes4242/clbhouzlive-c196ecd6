import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const INVALIDATE_KEYS = ['profile', 'user-profile', 'creator-features'];

export function useCreatorSettings(userId: string | undefined, initialIsCreator: boolean, initialCreatorOnly: boolean) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isCreator, setIsCreator] = useState(initialIsCreator);
  const [creatorOnly, setCreatorOnly] = useState(initialCreatorOnly);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showCreatorOnlyConfirm, setShowCreatorOnlyConfirm] = useState(false);
  const [showDisableCreatorOnlyConfirm, setShowDisableCreatorOnlyConfirm] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const invalidate = () =>
    INVALIDATE_KEYS.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));

  const toggleCreatorMode = async (enable: boolean) => {
    if (!userId) return;
    setIsUpdating(true);
    const prev = isCreator;
    setIsCreator(enable);
    try {
      const updates: Record<string, unknown> = { is_creator: enable };
      if (enable) {
        updates.creator_enabled_at = new Date().toISOString();
        updates.has_seen_creator_welcome = false;
      }
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);
      if (error) throw error;
      invalidate();
      if (enable) setShowWelcome(true);
    } catch {
      setIsCreator(prev);
      toast({ title: 'Error', description: 'Could not update creator mode.', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
      setShowEnableConfirm(false);
      setShowDisableConfirm(false);
    }
  };

  const toggleCreatorOnly = async (enable: boolean) => {
    if (!userId) return;
    setIsUpdating(true);
    const prev = creatorOnly;
    setCreatorOnly(enable);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ creator_only: enable })
        .eq('id', userId);
      if (error) throw error;
      invalidate();
    } catch {
      setCreatorOnly(prev);
      toast({ title: 'Error', description: 'Could not update creator-only setting.', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
      setShowCreatorOnlyConfirm(false);
      setShowDisableCreatorOnlyConfirm(false);
    }
  };

  return {
    isCreator, creatorOnly, isUpdating,
    showEnableConfirm, setShowEnableConfirm,
    showDisableConfirm, setShowDisableConfirm,
    showCreatorOnlyConfirm, setShowCreatorOnlyConfirm,
    showDisableCreatorOnlyConfirm, setShowDisableCreatorOnlyConfirm,
    showWelcome, setShowWelcome,
    toggleCreatorMode, toggleCreatorOnly,
  };
}
