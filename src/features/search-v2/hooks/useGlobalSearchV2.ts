import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import type {
  PersonHit,
  CourseHit,
  PlayerHit,
  ClubHit,
  VideoHit,
  PostHit,
} from '../lib/searchNavigation';

export type Scope = 'all' | 'people' | 'courses' | 'players' | 'clubs' | 'videos' | 'posts';

export type SearchBuckets = {
  people: PersonHit[];
  courses: CourseHit[];
  players: PlayerHit[];
  clubs: ClubHit[];
  videos: VideoHit[];
  posts: PostHit[];
};

const EMPTY: SearchBuckets = {
  people: [],
  courses: [],
  players: [],
  clubs: [],
  videos: [],
  posts: [],
};

function normalize(raw: any): SearchBuckets {
  if (!raw || typeof raw !== 'object') return EMPTY;
  return {
    people: Array.isArray(raw.people) ? raw.people : [],
    courses: Array.isArray(raw.courses) ? raw.courses : [],
    players: Array.isArray(raw.players) ? raw.players : [],
    clubs: Array.isArray(raw.clubs) ? raw.clubs : [],
    videos: Array.isArray(raw.videos) ? raw.videos : [],
    posts: Array.isArray(raw.posts) ? raw.posts : [],
  };
}

export function useGlobalSearchV2(opts: {
  query: string;
  scope: Scope;
  enabled?: boolean;
  limit?: number;
  offset?: number;
  debounceMs?: number;
}) {
  const {
    query,
    scope,
    enabled = true,
    limit = scope === 'all' ? 5 : 25,
    offset = 0,
    debounceMs = 250,
  } = opts;

  const debounced = useDebounce(query, debounceMs);
  const [data, setData] = useState<SearchBuckets>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const q = debounced.trim();
    if (!enabled || q.length === 0) {
      setData(EMPTY);
      setIsLoading(false);
      setError(null);
      return;
    }
    const my = ++seq.current;
    setIsLoading(true);
    setError(null);
    supabase
      .rpc('global_search_v2', {
        p_query: q,
        p_scope: scope,
        p_limit: limit,
        p_offset: offset,
      })
      .then(({ data: raw, error: err }) => {
        if (my !== seq.current) return;
        if (err) {
          setError(new Error(err.message));
          setData(EMPTY);
        } else {
          setData(normalize(raw));
        }
        setIsLoading(false);
      });
  }, [debounced, scope, enabled, limit, offset]);

  return { data, isLoading, error, debouncedQuery: debounced };
}
