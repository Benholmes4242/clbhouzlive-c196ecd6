/**
 * Amateur News — admin data access. A parallel of useTourStoriesAdmin against
 * public.amateur_stories, so the two beats never share a publish queue.
 *
 * Writes rely on RLS (is_panel_admin()), not on this client.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { StoryBlock } from '@/features/tourhub/news/blocks';
import { amateurBlocks } from '@/features/amateur/news/useAmateurStories';

export interface AdminAmateurStory {
  id: string;
  slug: string;
  kicker: string | null;
  headline: string;
  standfirst: string | null;
  body_blocks: StoryBlock[];
  source_text: string | null;
  image_url: string | null;
  image_credit: string | null;
  categories: string[];
  tournament_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AmateurStoryInput {
  slug: string;
  kicker: string | null;
  headline: string;
  standfirst: string | null;
  body_blocks: StoryBlock[];
  source_text: string | null;
  image_url: string | null;
  image_credit: string | null;
  categories: string[];
  tournament_name: string | null;
}

const COLS =
  'id, slug, kicker, headline, standfirst, body_blocks, source_text, image_url, image_credit, categories, tournament_name, published_at, created_at, updated_at';

const KEY = ['admin', 'amateur_stories'] as const;

function toAdminStory(row: any): AdminAmateurStory {
  return {
    ...row,
    body_blocks: amateurBlocks(row?.body_blocks),
    categories: Array.isArray(row?.categories) ? row.categories : [],
  } as AdminAmateurStory;
}

export function useAmateurStoriesAdmin() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ['amateur-stories'] });
  };

  const list = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<AdminAmateurStory[]> => {
      const { data, error } = await supabase
        .from('amateur_stories')
        .select(COLS)
        .order('published_at', { ascending: false, nullsFirst: true })
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map(toAdminStory);
    },
  });

  const create = useMutation({
    mutationFn: async (input: AmateurStoryInput) => {
      const { data, error } = await supabase
        .from('amateur_stories')
        .insert({ ...input, body_blocks: input.body_blocks as any, published_at: null })
        .select(COLS)
        .single();
      if (error) throw error;
      return toAdminStory(data);
    },
    onSuccess: invalidate,
  });

  /** Saving NEVER touches published_at. Publishing is its own action. */
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AmateurStoryInput> }) => {
      const { data, error } = await supabase
        .from('amateur_stories')
        .update({ ...patch, body_blocks: patch.body_blocks as any, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(COLS)
        .single();
      if (error) throw error;
      return toAdminStory(data);
    },
    onSuccess: invalidate,
  });

  const setPublishedAt = useMutation({
    mutationFn: async ({ id, publishedAt }: { id: string; publishedAt: string | null }) => {
      const { error } = await supabase
        .from('amateur_stories')
        .update({ published_at: publishedAt, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { id, publishedAt };
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('amateur_stories').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: invalidate,
  });

  return { ...list, stories: list.data ?? [], create, update, setPublishedAt, remove };
}

export function useAmateurSlugCollision(slug: string, excludeId?: string) {
  return useQuery({
    queryKey: ['admin', 'amateur_stories', 'slug', slug, excludeId ?? ''],
    enabled: slug.trim().length > 2,
    queryFn: async (): Promise<string | null> => {
      const { data } = await supabase
        .from('amateur_stories')
        .select('id, headline')
        .eq('slug', slug.trim())
        .limit(2);
      const hit = (data ?? []).find((r: any) => r.id !== excludeId);
      return hit ? ((hit as any).headline as string) : null;
    },
  });
}
