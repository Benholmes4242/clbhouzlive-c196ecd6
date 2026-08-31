/**
 * Amateur News — data access.
 *
 * An amateur row is mapped into the tour `TourStory` shape so the wire's reader
 * components (LeadStory, StoryRow, StoryArticle) take it UNCHANGED. Two beats,
 * two tables, one reading experience.
 *
 * `tour_slug` and `tournament_id` are ALWAYS null: there is no amateur tour and
 * no amateur tournament table, and the renderer must never look for one. The
 * null tournament_id is what suppresses the live tournament card.
 *
 * TOUR BLOCKS ARE STRIPPED AT READ TIME. A leaderboard, player, stat or round
 * block that somehow reached storage never reaches the renderer.
 *
 * A DRAFT IS INVISIBLE: every query mirrors the RLS policy, published_at
 * non-null and in the past.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseStoryBlocks, type StoryBlock } from '@/features/tourhub/news/blocks';
import type { TourStory } from '@/features/tourhub/news/useTourStories';

export interface AmateurStory extends TourStory {
  categories: string[];
  tournament_name: string | null;
}

const COLS =
  'id, slug, kicker, headline, standfirst, body_blocks, image_url, image_credit, categories, tournament_name, published_at';

/** The only block types amateur golf can render. */
const RENDERABLE = new Set(['paragraph', 'heading', 'image', 'quote']);

export function amateurRenderableBlocks(raw: unknown): StoryBlock[] {
  return parseStoryBlocks(raw).filter((b) => RENDERABLE.has(b.type));
}

function toStory(row: any): AmateurStory {
  return {
    id: row?.id,
    slug: row?.slug,
    kicker: row?.kicker ?? null,
    headline: row?.headline ?? '',
    standfirst: row?.standfirst ?? null,
    body_blocks: amateurRenderableBlocks(row?.body_blocks),
    image_url: row?.image_url ?? null,
    image_credit: row?.image_credit ?? null,
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
 * THE CATEGORY FILTER IS AN INCLUSION TEST AND NOTHING ELSE. An UNTAGGED story
 * belongs in ALL and nowhere else — matching an empty array against every
 * filter put a men's county story under GIRLS.
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
      return (data ?? []).map(toStory);
    },
  });

  const all = q.data ?? [];
  const stories =
    !category || category === 'all'
      ? all
      : all.filter((s) => s.categories.includes(category));

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
      return data ? toStory(data) : null;
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
      return (data ?? []).map(toStory).slice(0, 3);
    },
  });
}
