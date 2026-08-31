/**
 * Amateur News — data access.
 *
 * Deliberately the SAME SHAPE as the tour wire (useTourStories), because the
 * reader components are the same components. An amateur row is mapped into the
 * TourStory shape so LeadStory, StoryRow and StoryArticle take it unchanged.
 *
 * THE TOUR EMBEDS CANNOT WORK HERE. There is no amateur player table, no
 * amateur tournament table and no amateur leaderboard, so [leaderboard],
 * [player:], [stat:] and [round:] blocks are STRIPPED at read time and
 * tournament_id / tour_slug are always null. A missing player card can
 * therefore never break an amateur story: the block does not reach the
 * renderer at all.
 *
 * A DRAFT IS INVISIBLE: every query filters published_at to non-null and in the
 * past, mirroring the RLS policy.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseStoryBlocks, type StoryBlock } from '@/features/tourhub/news/blocks';
import type { TourStory } from '@/features/tourhub/news/useTourStories';

/** Block types the amateur renderer can honour. Everything else is dropped. */
const AMATEUR_BLOCK_TYPES = new Set<StoryBlock['type']>([
  'paragraph',
  'heading',
  'image',
  'quote',
]);

export function amateurBlocks(raw: unknown): StoryBlock[] {
  return parseStoryBlocks(raw).filter((b) => AMATEUR_BLOCK_TYPES.has(b.type));
}

/** An amateur story IS a TourStory plus its own two fields. */
export interface AmateurStory extends TourStory {
  categories: string[];
  tournament_name: string | null;
}

const COLS =
  'id, slug, kicker, headline, standfirst, body_blocks, image_url, image_credit, categories, tournament_name, published_at';

export function toAmateurStory(row: any): AmateurStory {
  return {
    id: row?.id,
    slug: row?.slug,
    kicker: row?.kicker ?? null,
    headline: row?.headline ?? '',
    standfirst: row?.standfirst ?? null,
    body_blocks: amateurBlocks(row?.body_blocks),
    image_url: row?.image_url ?? null,
    image_credit: row?.image_credit ?? null,
    // The amateur game has neither, and the renderer must not look for them.
    tour_slug: null,
    tournament_id: null,
    published_at: row?.published_at ?? null,
    categories: Array.isArray(row?.categories) ? (row.categories as string[]) : [],
    tournament_name: row?.tournament_name ?? null,
  };
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * The list. Newest first, always.
 *
 * The category lens is applied CLIENT-SIDE, exactly as the tour lens is: a
 * story with no categories is uncategorised beat news and belongs in every
 * lens, and filtering in SQL would make that a second query.
 */
export function useAmateurStories(category: string | null) {
  const q = useQuery({
    queryKey: ['amateur-stories', 'list'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AmateurStory[]> => {
      const { data, error } = await supabase
        .from('amateur_stories')
        .select(COLS)
        .not('published_at', 'is', null)
        .lte('published_at', nowIso())
        .order('published_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data ?? []).map(toAmateurStory);
    },
  });

  const all = q.data ?? [];
  const stories =
    !category || category === 'all'
      ? all
      : all.filter((s) => s.categories.length === 0 || s.categories.includes(category));

  return { ...q, all, stories, latestAt: stories[0]?.published_at ?? null };
}

/** One story by its public slug. Drafts resolve as not found. */
export function useAmateurStory(slug: string | undefined) {
  return useQuery({
    queryKey: ['amateur-stories', 'story', slug],
    enabled: !!slug,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AmateurStory | null> => {
      const { data, error } = await supabase
        .from('amateur_stories')
        .select(COLS)
        .eq('slug', slug as string)
        .not('published_at', 'is', null)
        .lte('published_at', nowIso())
        .maybeSingle();
      if (error) throw error;
      return data ? toAmateurStory(data) : null;
    },
  });
}

/** MORE AMATEUR NEWS — three rows, newest first, excluding the current story. */
export function useMoreAmateurNews(excludeId: string | undefined) {
  return useQuery({
    queryKey: ['amateur-stories', 'more', excludeId],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AmateurStory[]> => {
      let query = supabase
        .from('amateur_stories')
        .select(COLS)
        .not('published_at', 'is', null)
        .lte('published_at', nowIso())
        .order('published_at', { ascending: false })
        .limit(4);
      if (excludeId) query = query.neq('id', excludeId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(toAmateurStory).slice(0, 3);
    },
  });
}
