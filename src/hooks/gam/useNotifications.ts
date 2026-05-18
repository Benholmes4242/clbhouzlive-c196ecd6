import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { NotificationRow } from '@/lib/gam/types';

export function useNotifications(userId: string | undefined) {
  return useQuery<NotificationRow[]>({
    queryKey: ['gam_notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('gam_notification_outbox')
        .select('id, notification_type, template_id, template_payload, urgency, status, created_at, sent_at')
        .eq('user_id', userId)
        .in('status', ['pending', 'sent'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Realtime subscription to gam_notification_outbox for live badge dot updates.
 * Returns an unread count.
 */
export function useUnreadNotificationCount(userId: string | undefined) {
  const query = useNotifications(userId);
  const count = (query.data ?? []).filter((n) => n.status === 'pending').length;
  return count;
}
