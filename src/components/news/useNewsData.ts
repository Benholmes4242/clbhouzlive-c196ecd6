
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pub_date: string;
  source: string;
  image_url?: string;
  content?: string;
}

export const useNewsData = () => {
  return useQuery({
    queryKey: ['golf-news'],
    queryFn: async (): Promise<NewsArticle[]> => {
      // Check cache age first with timestamp query
      const { data: recentCheck } = await supabase
        .from('news_articles')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const cacheAge = recentCheck?.created_at 
        ? Date.now() - new Date(recentCheck.created_at).getTime()
        : Infinity;

      const CACHE_THRESHOLD = 10 * 60 * 1000; // 10 minutes

      // If cache is fresh, return immediately
      if (cacheAge < CACHE_THRESHOLD) {
        const { data: cachedArticles } = await supabase
          .from('news_articles')
          .select('*')
          .order('pub_date', { ascending: false })
          .limit(50);

        if (cachedArticles && cachedArticles.length > 0) {
          console.log(`Loaded ${cachedArticles.length} cached articles (${Math.floor(cacheAge / 1000)}s old)`);
          return cachedArticles;
        }
      }

      // Otherwise, trigger background refresh and return stale data immediately
      console.log('Triggering background news refresh...');
      
      // Fire-and-forget edge function call
      supabase.functions.invoke('fetch-news').catch(err => 
        console.error('Background news refresh failed:', err)
      );

      // Return stale articles immediately (don't wait for edge function)
      const { data: staleArticles } = await supabase
        .from('news_articles')
        .select('*')
        .order('pub_date', { ascending: false })
        .limit(50);

      console.log(`Loaded ${staleArticles?.length || 0} stale articles, refreshing in background`);
      return staleArticles || [];
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
