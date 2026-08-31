/**
 * The Wire — admin data access.
 *
 * DRAFTS AND PUBLISHED COME BACK TOGETHER, newest first, ordered by
 * published_at when there is one and created_at when there is not, so a draft
 * written today sits with today's stories rather than at the bottom of the list.
 *
 * Writes rely on RLS (is_panel_admin()), not on this client. The admin gate is a
 * convenience; the database is the boundary.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseStoryBlocks, type StoryBlock } from '@/features/tourhub/news/blocks';

export interface AdminStory {
  id: string;
  slug: string;
  kicker: string | null;
  headline: string;
  standfirst: string | null;
  body_blocks: StoryBlock[];
  source_text: string | null;
  image_url: string | null;
  image_credit: string | null;
  tour_slug: string | null;
  tournament_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** What the editor writes. Only headline and body_blocks are ever required. */
export interface StoryInput {
  slug: string;
  kicker: string | null;
  headline: string;
  standfirst: string | null;
  body_blocks: StoryBlock[];
  source_text: string | null;
  image_url: string | null;
  image_credit: string | null;
  tour_slug: string | null;
  tournament_id: string | null;
}

const COLS =
  'id, slug, kicker, headline, standfirst, body_blocks, source_text, image_url, image_credit, tour_slug, tournament_id, published_at, created_at, updated_at';

const KEY = ['admin', 'tour_stories'] as const;

function toAdminStory(row: any): AdminStory {
  return { ...row, body_blocks: parseStoryBlocks(row?.body_blocks) } as AdminStory;
}

/** A published_at in the future is SCHEDULED, not live. */
export type StoryState = 'draft' | 'scheduled' | 'published';

export function storyState(s: AdminStory): StoryState {
  if (!s.published_at) return 'draft';
  return new Date(s.published_at).getTime() > Date.now() ? 'scheduled' : 'published';
}

export function useTourStoriesAdmin() {
  const qc = useQueryClient();

  /** The reader-facing queries must see an edit immediately, not in five minutes. */
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ['tour-stories'] });
  };

  const list = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<AdminStory[]> => {
      const { data, error } = await supabase
        .from('tour_stories')
        .select(COLS)
        .order('published_at', { ascending: false, nullsFirst: true })
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map(toAdminStory);
    },
  });

  const create = useMutation({
    mutationFn: async (input: StoryInput) => {
      const { data, error } = await supabase
        .from('tour_stories')
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
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<StoryInput> }) => {
      const { data, error } = await supabase
        .from('tour_stories')
        .update({ ...patch, body_blocks: patch.body_blocks as any, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(COLS)
        .single();
      if (error) throw error;
      return toAdminStory(data);
    },
    onSuccess: invalidate,
  });

  /** publishedAt null returns a story to DRAFT. It is never a delete. */
  const setPublishedAt = useMutation({
    mutationFn: async ({ id, publishedAt }: { id: string; publishedAt: string | null }) => {
      const { error } = await supabase
        .from('tour_stories')
        .update({ published_at: publishedAt, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { id, publishedAt };
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tour_stories').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: invalidate,
  });

  return { ...list, stories: list.data ?? [], create, update, setPublishedAt, remove };
}

/**
 * Slug collision check. It WARNS; it does not block — the author decides, and a
 * near-duplicate slug is sometimes exactly what a follow-up story wants.
 */
export function useSlugCollision(slug: string, excludeId?: string) {
  return useQuery({
    queryKey: ['admin', 'tour_stories', 'slug', slug, excludeId ?? ''],
    enabled: slug.trim().length > 2,
    staleTime: 30_000,
    queryFn: async (): Promise<string | null> => {
      let q = supabase.from('tour_stories').select('id, headline').eq('slug', slug.trim()).limit(1);
      if (excludeId) q = q.neq('id', excludeId);
      const { data } = await q;
      return (data?.[0] as any)?.headline ?? null;
    },
  });
}

export interface TournamentOption {
  id: string;
  name: string;
  status: string | null;
  start_date: string | null;
  tour_code: string | null;
}

/**
 * The tournament picker's options. Live tournaments come FIRST so the common
 * case — a story about what is on right now — is the top row rather than a
 * search.
 */
export function useTournamentOptions(search: string) {
  return useQuery({
    queryKey: ['admin', 'tour_stories', 'tournaments', search.trim().toLowerCase()],
    staleTime: 2 * 60_000,
    queryFn: async (): Promise<{ live: TournamentOption[]; recent: TournamentOption[] }> => {
      const term = search.trim();
      let q = supabase
        .from('sr_tournaments')
        .select('id, name, status, start_date')
        .order('start_date', { ascending: false })
        .limit(term ? 40 : 25);
      if (term) q = q.ilike('name', `%${term}%`);
      const { data, error } = await q;
      if (error) throw error;
      const rows = ((data ?? []) as any[]).map((r) => ({
        id: r.id as string,
        name: (r.name as string) ?? '',
        status: (r.status as string) ?? null,
        start_date: (r.start_date as string) ?? null,
        tour_code: null,
      }));
      const isLive = (r: TournamentOption) => (r.status ?? '').toLowerCase() === 'inprogress';
      return { live: rows.filter(isLive), recent: rows.filter((r) => !isLive(r)) };
    },
  });
}
