/** CB83 dates-only query; UTC bucket ownership lives in visitBuckets. */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export function useBusinessPostDays(businessId: string | undefined, days: number) {
  return useQuery({
    queryKey: ['business-post-days', businessId, days], enabled: !!businessId,
    placeholderData: keepPreviousData, staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string[]> => {
      if (!businessId) return [];
      const since = new Date(); since.setUTCHours(0, 0, 0, 0);
      since.setUTCDate(since.getUTCDate() - (days === 90 ? 90 : days - 1));
      const { data, error } = await supabase.from('posts').select('created_at')
        .eq('actor_type', 'business').eq('actor_id', businessId).eq('status', 'published')
        .gte('created_at', since.toISOString()).lte('created_at', new Date().toISOString());
      if (error) throw error;
      return (data ?? []).map(p => p.created_at).filter((d): d is string => typeof d === 'string');
    },
  });
}