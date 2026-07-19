import { useCallback, useEffect, useRef, useState } from 'react';
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

function normalize(raw: unknown): SearchBuckets {
  if (!raw || typeof raw !== 'object') return EMPTY;
  const r = raw as Record<string, unknown>;
  return {
    people: Array.isArray(r.people) ? (r.people as PersonHit[]) : [],
    courses: Array.isArray(r.courses) ? (r.courses as CourseHit[]) : [],
    players: Array.isArray(r.players) ? (r.players as PlayerHit[]) : [],
    clubs: Array.isArray(r.clubs) ? (r.clubs as ClubHit[]) : [],
    videos: Array.isArray(r.videos) ? (r.videos as VideoHit[]) : [],
    posts: Array.isArray(r.posts) ? (r.posts as PostHit[]) : [],
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
  const [retryNonce, setRetryNonce] = useState(0);
  const seq = useRef(0);

  const refetch = useCallback(() => setRetryNonce((n) => n + 1), []);

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
  }, [debounced, scope, enabled, limit, offset, retryNonce]);

  return { data, isLoading, error, debouncedQuery: debounced, refetch };
}
