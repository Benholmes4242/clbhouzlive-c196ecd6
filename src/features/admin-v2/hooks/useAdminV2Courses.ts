import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useGolfCoursesStats } from '@/hooks/admin/useGolfCoursesStats';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COURSE_COLUMNS = `
  id, name, country, sub_country, region, continent,
  global_rank, regional_rank, usa_rank,
  thumbnail_image, latitude, longitude,
  website_url, description, created_at
`;

function applySearch(query: any, search: string) {
  if (search.trim()) {
    const q = search.trim();
    query = query.or(`name.ilike.%${q}%,country.ilike.%${q}%,sub_country.ilike.%${q}%`);
  }
  return query;
}

function applyFilter(query: any, listFilter: CourseFilterList) {
  switch (listFilter) {
    case 'global':
      return query.not('global_rank', 'is', null);
    case 'usa':
      return query.not('usa_rank', 'is', null);
    case 'europe':
      return query.not('regional_rank', 'is', null);
    case 'gbi':
      return query
        .not('regional_rank', 'is', null)
        .in('country', ['England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland']);
    case 'unranked':
      return query
        .is('global_rank', null)
        .is('regional_rank', null)
        .is('usa_rank', null);
    default:
      return query;
  }
}

function mapCourseRow(
  c: any,
  ratingsMap: Map<string, CourseRatingAggregateRow>,
): AdminCourseRow {
  return {
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
  };
}

// ─── Server-side fetchers ─────────────────────────────────────────────────────

interface FetchParams {
  search: string;
  listFilter: CourseFilterList;
  page: number;
  pageSize: number;
}

async function fetchCourses({ search, listFilter, page, pageSize }: FetchParams) {
  let query = supabase
    .from('golf_courses')
    .select(COURSE_COLUMNS, { count: 'exact' });

  query = applySearch(query, search);
  query = applyFilter(query, listFilter);

  // Sort by relevant rank column when a list filter is active
  const sortCol =
    listFilter === 'global'  ? 'global_rank' :
    listFilter === 'usa'     ? 'usa_rank' :
    listFilter === 'europe'  ? 'regional_rank' :
    listFilter === 'gbi'     ? 'regional_rank' :
    'name';

  query = query.order(sortCol, { ascending: true, nullsFirst: false });
  if (sortCol !== 'name') query = query.order('name', { ascending: true });

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  // Ratings scoped to this page only
  const courseIds = (data ?? []).map((c: any) => c.id);
  const ratingsMap = new Map<string, CourseRatingAggregateRow>();

  if (courseIds.length > 0) {
    const { data: ratingsData } = await (supabase
      .from('course_rating_aggregates' as any)
      .select('course_id, avg_overall_score, review_count')
      .in('course_id', courseIds) as any as Promise<{ data: CourseRatingAggregateRow[] | null; error: any }>);

    (ratingsData ?? []).forEach(r => ratingsMap.set(r.course_id, r));
  }

  return {
    courses: (data ?? []).map((c: any) => mapCourseRow(c, ratingsMap)),
    totalCount: count ?? 0,
  };
}

/** Parallel count queries for each filter tab */
async function fetchFilterCounts(search: string) {
  const buildQuery = () => {
    let q = supabase.from('golf_courses').select('*', { count: 'exact', head: true });
    return applySearch(q, search);
  };

  const [all, global, usa, gbi, europe, unranked] = await Promise.all([
    buildQuery(),
    (() => {
      let q = supabase.from('golf_courses').select('*', { count: 'exact', head: true });
      q = applySearch(q, search);
      return q.not('global_rank', 'is', null);
    })(),
    (() => {
      let q = supabase.from('golf_courses').select('*', { count: 'exact', head: true });
      q = applySearch(q, search);
      return q.not('usa_rank', 'is', null);
    })(),
    (() => {
      let q = supabase.from('golf_courses').select('*', { count: 'exact', head: true });
      q = applySearch(q, search);
      return q
        .not('regional_rank', 'is', null)
        .in('country', ['England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland']);
    })(),
    (() => {
      let q = supabase.from('golf_courses').select('*', { count: 'exact', head: true });
      q = applySearch(q, search);
      return q.not('regional_rank', 'is', null);
    })(),
    (() => {
      let q = supabase.from('golf_courses').select('*', { count: 'exact', head: true });
      q = applySearch(q, search);
      return q.is('global_rank', null).is('regional_rank', null).is('usa_rank', null);
    })(),
  ]);

  return {
    all:      all.count ?? 0,
    global:   global.count ?? 0,
    gbi:      gbi.count ?? 0,
    usa:      usa.count ?? 0,
    europe:   europe.count ?? 0,
    unranked: unranked.count ?? 0,
  };
}

/** Fetch a single course for the drawer */
async function fetchSingleCourse(id: string): Promise<AdminCourseRow | null> {
  const { data, error } = await supabase
    .from('golf_courses')
    .select(COURSE_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;

  const ratingsMap = new Map<string, CourseRatingAggregateRow>();
  const { data: ratingData } = await (supabase
    .from('course_rating_aggregates' as any)
    .select('course_id, avg_overall_score, review_count')
    .eq('course_id', id)
    .maybeSingle() as any as Promise<{ data: CourseRatingAggregateRow | null; error: any }>);

  if (ratingData) ratingsMap.set(ratingData.course_id, ratingData);
  return mapCourseRow(data, ratingsMap);
}

async function updateCourse(
  id: string,
  updates: Partial<Pick<AdminCourseRow,
    'name' | 'global_rank' | 'regional_rank' | 'usa_rank' |
    'website_url' | 'description'
  >>
): Promise<void> {
  const { error } = await supabase
    .from('golf_courses')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

async function uploadCoursePhoto(courseId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `course-photos/${courseId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('course-images')
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('course-images')
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from('golf_courses')
    .update({ thumbnail_image: publicUrl })
    .eq('id', courseId);
  if (updateError) throw updateError;

  return publicUrl;
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useAdminV2Courses() {
  const qc = useQueryClient();
  const [search, setSearch]           = useState('');
  const [listFilter, setListFilter]   = useState<CourseFilterList>('all');
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(100);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerCourseId, setDrawerCourseId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // ── Server-side paginated course list ──
  const { data: courseData, isLoading, refetch } = useQuery({
    queryKey:  ['admin-v2', 'courses', 'list', debouncedSearch, listFilter, page, pageSize],
    queryFn:   () => fetchCourses({ search: debouncedSearch, listFilter, page, pageSize }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const courses      = courseData?.courses ?? [];
  const filteredCount = courseData?.totalCount ?? 0;

  // ── Filter tab counts ──
  const { data: countsData } = useQuery({
    queryKey:  ['admin-v2', 'courses', 'counts', debouncedSearch],
    queryFn:   () => fetchFilterCounts(debouncedSearch),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const counts = countsData ?? { all: 0, global: 0, gbi: 0, usa: 0, europe: 0, unranked: 0 };

  // ── KPI stats from the dedicated stats hook (server-side counts) ──
  const { data: kpiStats } = useGolfCoursesStats();

  const stats = useMemo(() => ({
    total:      kpiStats?.totalCourses ?? 0,
    geocoded:   (kpiStats?.totalCourses ?? 0) - (kpiStats?.missingCoordinates ?? 0),
    withImages: (kpiStats?.totalCourses ?? 0) - (kpiStats?.missingImages ?? 0),
    inTop100:   kpiStats?.verifiedCourses ?? 0,
  }), [kpiStats]);

  // ── Drawer course (fetched individually) ──
  const { data: drawerCourse = null } = useQuery({
    queryKey:  ['admin-v2', 'courses', 'detail', drawerCourseId],
    queryFn:   () => fetchSingleCourse(drawerCourseId!),
    enabled:   !!drawerCourseId,
    staleTime: 30_000,
  });

  // ── Update mutation ──
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateCourse>[1] }) =>
      updateCourse(id, updates),
    onSuccess: () => {
      toast.success('Course updated');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'courses'] });
    },
    onError: () => toast.error('Failed to update course'),
  });

  // ── Photo upload mutation ──
  const photoMutation = useMutation({
    mutationFn: ({ courseId, file }: { courseId: string; file: File }) =>
      uploadCoursePhoto(courseId, file),
    onSuccess: () => {
      toast.success('Photo updated');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'courses'] });
    },
    onError: () => toast.error('Failed to upload photo'),
  });

  // ── Delete mutation (via edge function with safety checks) ──
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('delete-golf-course', {
        body: { courseId: id },
      });
      if (error) throw error;
      if (data?.error) {
        const err = new Error(data.reason ?? data.error) as any;
        err.counts = data.counts;
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Course deleted');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'courses'] });
    },
    onError: (err: any) => {
      if (err.counts) {
        toast.error('Cannot delete this course', {
          description: err.message,
          duration: 8000,
        });
      } else {
        toast.error('Failed to delete course');
      }
    },
  });

  // ── Handlers ──
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleFilter = (v: string) => { setListFilter(v as CourseFilterList); setPage(1); };

  return {
    courses,
    allCount:      counts.all,
    filteredCount,
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
    uploadPhoto: (courseId: string, file: File) =>
      photoMutation.mutate({ courseId, file }),
    isUploadingPhoto: photoMutation.isPending,
    deleteCourse: (id: string) => deleteMutation.mutate(id),
    isDeleting: deleteMutation.isPending,
  };
}
