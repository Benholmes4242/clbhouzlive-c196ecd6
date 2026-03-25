import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDeleteAccount(userId: string | undefined) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBusinessWarning, setShowBusinessWarning] = useState(false);
  const [ownedBusinessNames, setOwnedBusinessNames] = useState<string[]>([]);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const initiateDelete = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('business_members')
      .select('business_accounts(name)')
      .eq('user_profile_id', userId)
      .eq('role', 'owner');

    const names = (data ?? [])
      .map((m: any) => m.business_accounts?.name)
      .filter(Boolean) as string[];

    if (names.length > 0) {
      setOwnedBusinessNames(names);
      setShowBusinessWarning(true);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (!userId || deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      // Force a session refresh to ensure token is valid before calling the edge function
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session) throw new Error('Session expired — please log in again');

      const { error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (err) {
      console.error('[deleteAccount] Error:', err);
      toast.error('Could not delete account.', {
        description: err instanceof Error ? err.message : String(err),
      });
      setIsDeleting(false);
    }
  };

  return {
    showDeleteConfirm, setShowDeleteConfirm,
    showBusinessWarning, setShowBusinessWarning,
    ownedBusinessNames,
    deleteConfirmText, setDeleteConfirmText,
    isDeleting,
    initiateDelete, confirmDelete,
  };
}
