import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { removePersistedQueryCache } from '@/lib/queryPersister';

export function useDeleteAccount(userId: string | undefined) {
  const queryClient = useQueryClient();
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

      const { data: fnData, error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        let serverReason: string | null = null;
        let parsed: any = null;
        const ctx = (error as any).context;
        if (ctx && typeof ctx.text === 'function') {
          try {
            serverReason = (await ctx.text())?.slice(0, 300);
            parsed = serverReason ? JSON.parse(serverReason) : null;
          } catch {}
        }
        console.error('[deleteAccount] edge error', {
          name: error.name, message: error.message,
          status: ctx?.status, body: serverReason,
        });
        // Honest failure: the function now reports an incomplete deletion with
        // HTTP 500 instead of a false success. Surface it as such.
        if (parsed?.error === 'account_deletion_incomplete') {
          throw new Error(
            parsed.access_revoked
              ? 'We could not finish deleting your account, so we have locked it and signed you out. Contact support to complete the deletion.'
              : `We could not finish deleting your account. Contact support (ref ${parsed.deletionAuditId ?? 'unknown'}).`,
          );
        }
        throw error;
      }
      // A 200 can still be an explicit no-op; only treat a real success as done.
      if (fnData && (fnData as any).success !== true) {
        throw new Error((fnData as any).error ?? 'Account deletion did not complete.');
      }

      await supabase.auth.signOut();
      queryClient.clear();
      await removePersistedQueryCache();
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
