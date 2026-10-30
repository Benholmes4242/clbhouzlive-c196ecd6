/** ST4 reads the member's existing preference store on mount (including returns
 * from Notifications). Failed or pending reads never expose cached summaries. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES } from '@/lib/notifications/notificationCategories';

export function alertSummary(mutedTypes: readonly string[]): string {
  const muted = new Set(mutedTypes);
  const on = CATEGORIES.filter(category => !category.types.some(type => muted.has(type))).length;
  return on === CATEGORIES.length ? `All ${on} on` : on === 0 ? 'All off' : `${on} of ${CATEGORIES.length} on`;
}

export function useSettingsAlertSummary(userId?: string): string | null {
  const query = useQuery({
    queryKey: ['settings-alert-summary', userId],
    enabled: !!userId,
    refetchOnMount: 'always',
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from('notification_preferences').select('muted_types').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return (data?.muted_types as string[] | null) ?? [];
    },
  });
  return !userId || query.isPending || query.isFetching || query.isError || !query.data ? null : alertSummary(query.data);
}