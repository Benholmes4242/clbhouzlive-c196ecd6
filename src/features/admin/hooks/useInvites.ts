import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

/** Invite actions only. Invite rows come from get_admin_members_overview,
 * which already excludes anyone holding an unexpired admin membership. */
export function useInvites() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-v2'] });
  };

  const invoke = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('admin-invite-manage', { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const create = useMutation({
    mutationFn: ({ invitedUserId, role }: { invitedUserId: string; role: string }) =>
      invoke({ action: 'create_invite', invited_user_id: invitedUserId, role }),
    onSuccess: (data) => {
      if (data?.email_sent === false) toast.warning('Invite saved, but the email could not be sent');
      else toast.success('Invite sent');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to send invite'),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => invoke({ action: 'revoke_invite', id }),
    onSuccess: () => { toast.success('Invite cancelled'); invalidate(); },
    onError: (e: Error) => toast.error(e.message || 'Failed to cancel invite'),
  });

  const resend = useMutation({
    mutationFn: (id: string) => invoke({ action: 'resend_invite', id }),
    onSuccess: (data) => {
      if (data?.email_sent === false) toast.warning('Invite saved, but the email could not be sent');
      else toast.success('Invite sent again, expires in 7 days');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to resend invite'),
  });

  return { create, cancel, resend };
}
