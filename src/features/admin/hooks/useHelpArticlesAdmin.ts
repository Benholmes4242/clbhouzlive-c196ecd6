import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HelpArticle } from '@/hooks/useHelpArticles';

export type AdminHelpArticle = HelpArticle;

export interface HelpArticleInput {
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
}

const ADMIN_KEY = ['help_articles', 'admin'] as const;
const PUBLIC_KEY = ['help_articles', 'published'] as const;

export function useHelpArticlesAdmin() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ADMIN_KEY });
    qc.invalidateQueries({ queryKey: PUBLIC_KEY });
  };

  const list = useQuery({
    queryKey: ADMIN_KEY,
    queryFn: async (): Promise<{ all: AdminHelpArticle[]; grouped: Record<string, AdminHelpArticle[]> }> => {
      const { data, error } = await supabase
        .from('help_articles')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const all = (data ?? []) as AdminHelpArticle[];
      const grouped: Record<string, AdminHelpArticle[]> = {};
      for (const a of all) (grouped[a.category] ||= []).push(a);
      return { all, grouped };
    },
  });

  const create = useMutation({
    mutationFn: async (input: HelpArticleInput) => {
      const { data, error } = await supabase
        .from('help_articles')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as AdminHelpArticle;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<HelpArticleInput> }) => {
      const { data, error } = await supabase
        .from('help_articles')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AdminHelpArticle;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('help_articles').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: invalidate,
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('help_articles')
        .update({ is_published, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { id, is_published };
    },
    onSuccess: invalidate,
  });

  return {
    ...list,
    articles: list.data?.all ?? [],
    grouped: list.data?.grouped ?? {},
    create,
    update,
    remove,
    togglePublish,
  };
}
