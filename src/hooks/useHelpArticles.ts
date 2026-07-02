import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HelpArticle {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function useHelpArticles() {
  return useQuery({
    queryKey: ['help_articles', 'published'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<{ all: HelpArticle[]; grouped: Record<string, HelpArticle[]> }> => {
      const { data, error } = await supabase
        .from('help_articles')
        .select('*')
        .eq('is_published', true)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const all = (data ?? []) as HelpArticle[];
      const grouped: Record<string, HelpArticle[]> = {};
      for (const a of all) {
        (grouped[a.category] ||= []).push(a);
      }
      return { all, grouped };
    },
  });
}
