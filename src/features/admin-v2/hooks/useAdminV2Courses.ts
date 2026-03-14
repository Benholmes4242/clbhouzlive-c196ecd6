import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminCourseRow {
  id:             string;
  name:           string;
  country:        string;
  sub_country:    string | null;
  region:         string | null;
  continent:      string;
  global_rank:    number | null;
  regional_rank:  number | null;
  usa_rank:       number | null;
  thumbnail_image:string | null;
  latitude:       number | null;
  longitude:      number | null;
  website_url:    string | null;
  description:    string | null;
  created_at:     string;
  avg_rating:     number | null;
  review_count:   number | null;
}

export type CourseFilterList = 'all' | 'global' | 'gbi' | 'usa' | 'europe' | 'unranked';

interface CourseRatingAggregateRow {
  course_id:         string;
  avg_overall_score: number | null;
  review_count:      number | null;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchCourses(): Promise<AdminCourseRow[]> {
  const { data, error } = await supabase
    .from('golf_courses')
    .select(`
      id, name, country, sub_country, region, continent,
      global_rank, regional_rank, usa_rank,
      thumbnail_image, latitude, longitude,
      website_url, description, created_at
    `)
    .order('name', { ascending: true })
    .limit(5000);

  if (error) throw error;

  // Separate query for ratings (view — no FK for PostgREST nested select)
  const courseIds = (data ?? []).map(c => c.id);
  const { data: ratingsData } = await (supabase
    .from('course_rating_aggregates' as any)
    .select('course_id, avg_overall_score, review_count')
    .in('course_id', courseIds) as any as Promise<{ data: CourseRatingAggregateRow[] | null; error: any }>);

  const ratingsMap = new Map(
    (ratingsData ?? []).map(r => [r.course_id, r])
  );

  return (data ?? []).map((c: any) => ({
    id:             c.id,
    name:           c.name,
    country:        c.country,
    sub_country:    c.sub_country,
    region:         c.region,
    continent:      c.continent,
    global_rank:    c.global_rank,
    regional_rank:  c.regional_rank,
    usa_rank:       c.usa_rank,
    thumbnail_image:c.thumbnail_image,
    latitude:       c.latitude,
    longitude:      c.longitude,
    website_url:    c.website_url,
    description:    c.description,
    created_at:     c.created_at,
    avg_rating:     ratingsMap.get(c.id)?.avg_overall_score ?? null,
    review_count:   ratingsMap.get(c.id)?.review_count ?? null,
  }));
}

async function updateCourse(
  id: string,
  updates: Partial<Pick<AdminCourseRow, 'name' | 'global_rank' | 'regional_rank' | 'usa_rank' | 'website_url' | 'description'>>
): Promise<void> {
  const { error } = await supabase
    .from('golf_courses')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useAdminV2Courses() {
  const qc = useQueryClient();
  const [search, setSearch]           = useState('');
  const [listFilter, setListFilter]   = useState<CourseFilterList>('all');
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerCourseId, setDrawerCourseId] = useState<string | null>(null);

  const { data: allCourses = [], isLoading, refetch } = useQuery({
    queryKey:  ['admin-v2', 'courses', 'all'],
    queryFn:   fetchCourses,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  // Client-side filter + search
  const filtered = useMemo(() => {
    let rows = allCourses;

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (c.sub_country ?? '').toLowerCase().includes(q)
      );
    }

    switch (listFilter) {
      case 'global':   rows = rows.filter(c => c.global_rank != null);   break;
      case 'gbi':      rows = rows.filter(c => c.regional_rank != null && ['England','Scotland','Wales','Ireland','Northern Ireland'].includes(c.country)); break;
      case 'usa':      rows = rows.filter(c => c.usa_rank != null);       break;
      case 'europe':   rows = rows.filter(c => c.regional_rank != null);  break;
      case 'unranked': rows = rows.filter(c => c.global_rank == null && c.regional_rank == null && c.usa_rank == null); break;
    }

    return rows;
  }, [allCourses, search, listFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleFilter = (v: string) => { setListFilter(v as CourseFilterList); setPage(1); };

  // Detail — find from cache
  const drawerCourse = useMemo(
    () => allCourses.find(c => c.id === drawerCourseId) ?? null,
    [allCourses, drawerCourseId]
  );

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateCourse>[1] }) =>
      updateCourse(id, updates),
    onSuccess: () => {
      toast.success('Course updated');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'courses', 'all'] });
    },
    onError: () => toast.error('Failed to update course'),
  });

  // Stats
  const stats = useMemo(() => ({
    total:     allCourses.length,
    geocoded:  allCourses.filter(c => c.latitude != null && c.longitude != null).length,
    withImages:allCourses.filter(c => c.thumbnail_image != null).length,
    inTop100:  allCourses.filter(c => c.global_rank != null).length,
  }), [allCourses]);

  const counts = useMemo(() => ({
    all:      allCourses.length,
    global:   allCourses.filter(c => c.global_rank != null).length,
    gbi:      allCourses.filter(c => c.usa_rank == null && c.regional_rank != null).length,
    usa:      allCourses.filter(c => c.usa_rank != null).length,
    europe:   allCourses.filter(c => c.regional_rank != null).length,
    unranked: allCourses.filter(c => c.global_rank == null && c.regional_rank == null && c.usa_rank == null).length,
  }), [allCourses]);

  return {
    courses:       paginated,
    allCount:      allCourses.length,
    filteredCount: filtered.length,
    isLoading,
    refetch,
    stats,
    counts,
    search,        setSearch: handleSearch,
    listFilter,    setListFilter: handleFilter,
    page,          setPage,
    pageSize,      setPageSize,
    selectedIds,   setSelectedIds,
    drawerCourseId, setDrawerCourseId,
    drawerCourse,
    updateCourse: (id: string, updates: Parameters<typeof updateCourse>[1]) =>
      updateMutation.mutate({ id, updates }),
    isUpdating: updateMutation.isPending,
  };
}
