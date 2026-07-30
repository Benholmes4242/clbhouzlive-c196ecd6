/**
 * useCourseDirectorySearch — paged name search over the full course directory.
 *
 * Wraps the existing explore_courses_by_rating RPC. No ordering is applied
 * client-side: the RPC orders by rating descending, so an exact name match can
 * sit below a higher-rated partial match. Accepted limitation for v1.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

export const DIRECTORY_PAGE_SIZE = 20;
export const DIRECTORY_MIN_QUERY = 2;

export interface DirectoryCourseRow {
  id: string;
  name: string;
  sub_country: string | null;
  country: string | null;
  thumbnail_image: string | null;
  average_rating: number | null;
}

function normalise(raw: Record<string, unknown>): DirectoryCourseRow {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    sub_country: (raw.sub_country as string) ?? null,
    country: (raw.country as string) ?? null,
    thumbnail_image: (raw.thumbnail_image as string) ?? null,
    average_rating:
      raw.average_rating === null || raw.average_rating === undefined
        ? null
        : Number(raw.average_rating),
  };
}

export function useCourseDirectorySearch(term: string, country: string | null) {
  const debounced = useDebounce(term.trim(), 300);
  const enabled = debounced.length >= DIRECTORY_MIN_QUERY;

  const [rows, setRows] = useState<DirectoryCourseRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaging, setIsPaging] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (offset: number) => {
      const id = ++requestId.current;
      if (offset === 0) setIsLoading(true);
      else setIsPaging(true);

      const { data, error } = await supabase.rpc('explore_courses_by_rating', {
        p_country: country,
        p_sub_country: null,
        p_search: debounced,
        p_limit: DIRECTORY_PAGE_SIZE,
        p_offset: offset,
      });

      if (id !== requestId.current) return;

      if (error) {
        if (offset === 0) setRows([]);
        setHasMore(false);
      } else {
        const next = ((data ?? []) as Record<string, unknown>[]).map(normalise);
        setHasMore(next.length === DIRECTORY_PAGE_SIZE);
        setRows((prev) => (offset === 0 ? next : [...prev, ...next]));
      }
      setIsLoading(false);
      setIsPaging(false);
    },
    [country, debounced],
  );

  useEffect(() => {
    if (!enabled) {
      requestId.current += 1;
      setRows([]);
      setHasMore(false);
      setIsLoading(false);
      setIsPaging(false);
      return;
    }
    void fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, debounced, country]);

  const loadMore = useCallback(() => {
    if (!enabled || isLoading || isPaging || !hasMore) return;
    void fetchPage(rows.length);
  }, [enabled, isLoading, isPaging, hasMore, fetchPage, rows.length]);

  return { rows, isLoading, isPaging, hasMore, loadMore, enabled, debounced };
}
