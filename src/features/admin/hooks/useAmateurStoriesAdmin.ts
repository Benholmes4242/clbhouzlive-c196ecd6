/**
 * Amateur News — admin data access. Modelled on useTourStoriesAdmin, over
 * public.amateur_stories.
 *
 * Writes rely on RLS (is_panel_admin()); the admin gate is a convenience and
 * the database is the boundary.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { StoryBlock } from '@/features/tourhub/news/blocks';
import { amateurRenderableBlocks } from '@/features/amateur/news/useAmateurStories';

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

function toAdmin(row: any): AdminAmateurStory {
  return {
    ...row,
    /* The renderer only takes four block types; the admin list must count what
       a reader will actually get, not what is in the column. */
    body_blocks: amateurRenderableBlocks(row?.body_blocks),
    categories: Array.isArray(row?.categories) ? row.categories : [],
  } as AdminAmateurStory;
}

export type AmateurStoryState = 'draft' | 'scheduled' | 'published';

export function amateurStoryState(s: AdminAmateurStory): AmateurStoryState {
  if (!s.published_at) return 'draft';
  return new Date(s.published_at).getTime() > Date.now() ? 'scheduled' : 'published';
}

export function useAmateurStoriesAdmin() {
  const qc = useQueryClient();

  /** The reader-facing queries must see an edit immediately. `refetchType: 'all'`
   *  is explicit: an app-wide refetchOnMount default can otherwise leave an
   *  invalidated-but-inactive list stale when the page mounts next. */
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY, refetchType: 'all' });
    qc.invalidateQueries({ queryKey: ['amateur-stories'], refetchType: 'all' });
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
      return (data ?? []).map(toAdmin);
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
      return toAdmin(data);
    },
    onSuccess: invalidate,
  });

  /** Saving NEVER touches published_at. */
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AmateurStoryInput> }) => {
      const { data, error } = await supabase
        .from('amateur_stories')
        .update({ ...patch, body_blocks: patch.body_blocks as any, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(COLS)
        .single();
      if (error) throw error;
      return toAdmin(data);
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

/** Slug collision. It WARNS; it does not block. */
export function useAmateurSlugCollision(slug: string, excludeId?: string) {
  return useQuery({
    queryKey: ['admin', 'amateur_stories', 'slug', slug, excludeId ?? ''],
    enabled: slug.trim().length > 2,
    staleTime: 30_000,
    queryFn: async (): Promise<string | null> => {
      let q = supabase.from('amateur_stories').select('id, headline').eq('slug', slug.trim()).limit(1);
      if (excludeId) q = q.neq('id', excludeId);
      const { data } = await q;
      return (data?.[0] as any)?.headline ?? null;
    },
  });
}
