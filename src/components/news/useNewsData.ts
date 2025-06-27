
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
      // First try to get cached articles from database
      const { data: cachedArticles, error: dbError } = await supabase
        .from('news_articles')
        .select('*')
        .order('pub_date', { ascending: false })
        .limit(50);

      if (cachedArticles && cachedArticles.length > 0) {
        console.log(`Loaded ${cachedArticles.length} cached articles from database`);
        return cachedArticles;
      }

      // If no cached articles, fetch fresh ones
      console.log('No cached articles found, fetching fresh news...');
      const { data, error } = await supabase.functions.invoke('fetch-news');
      
      if (error) {
        console.error('Error fetching news:', error);
        throw new Error('Failed to fetch news');
      }

      // After fetching, get the updated articles from database
      const { data: freshArticles, error: freshError } = await supabase
        .from('news_articles')
        .select('*')
        .order('pub_date', { ascending: false })
        .limit(50);

      if (freshError) {
        console.error('Error getting fresh articles:', freshError);
        throw new Error('Failed to get fresh articles');
      }

      console.log(`Loaded ${freshArticles?.length || 0} fresh articles from database`);
      return freshArticles || [];
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
