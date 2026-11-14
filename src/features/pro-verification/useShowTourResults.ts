/** One viewer-scoped optimistic setter for both rankings cards. Source readers
 * retain server visibility authority; linked player caches are refreshed too. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
export function useShowTourResults(userId: string) {
  const cache = useQueryClient();
  const key = ['show-tour-results', userId];
  const query = useQuery({ queryKey: key, enabled: !!userId, queryFn: async () => {
    const result = await supabase.from('user_profiles').select('show_tour_results').eq('id', userId).single();
    if (result.error) throw result.error;
    return result.data.show_tour_results ?? true;
  } });
  const mutation = useMutation({ mutationFn: async (next: boolean) => {
    const result = await supabase.from('user_profiles').update({ show_tour_results: next }).eq('id', userId).select('show_tour_results').single();
    if (result.error) throw result.error;
    if (result.data.show_tour_results !== next) throw new Error('Visibility update did not persist');
    return next;
  }, onMutate: async next => {
    await cache.cancelQueries({ queryKey: key });
    const previous = cache.getQueryData<boolean>(key);
    cache.setQueryData(key, next);
    return { previous };
  }, onError: (_error, _next, context) => {
    cache.setQueryData(key, context?.previous ?? true);
    toast.error('Could not update. Please try again.');
  }, onSuccess: async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ['pro-profile'] }),
      ...['profile', 'user-profile', 'wagr-link', 'amateur-summary', 'amateur-history', 'amateur-events', 'amateur-career', 'pro-world-rank'].map(prefix => cache.invalidateQueries({ queryKey: [prefix, userId] })),
    ]);
  } });
  return { checked: query.data ?? true, disabled: query.isPending || query.isError || mutation.isPending, saving: mutation.isPending, toggle: (next: boolean) => mutation.mutate(next) };
}