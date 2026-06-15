import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useGolfCoursesStats } from '@/hooks/admin/useGolfCoursesStats';

export interface AdminCourseRow {
  id: string;
  name: string;
  country: string;
  sub_country: string | null;
  region: string | null;
  continent: string;
  global_rank: number | null;
  regional_rank: number | null;
  usa_rank: number | null;
  country_rank: number | null;
  thumbnail_image: string | null;
  latitude: number | null;
  longitude: number | null;
  website_url: string | null;
  description: string | null;
  created_at: string;
  avg_rating: number | null;
  review_count: number | null;
  country_code: string | null;
  course_type: string | null;
  has_hosted_major: boolean | null;
  top100_url: string | null;
}

const COURSE_COLUMNS = `
  id, name, country, sub_country, region, continent,
  global_rank, regional_rank, usa_rank, country_rank,
  thumbnail_image, latitude, longitude,
  website_url, description, created_at,
  country_code, course_type, has_hosted_major, top100_url
`;

interface RatingAgg { course_id: string; avg_overall_score: number | null; review_count: number | null; }

function mapRow(c: any, ratings: Map<string, RatingAgg>): AdminCourseRow {
  return {
    id: c.id, name: c.name, country: c.country, sub_country: c.sub_country,
    region: c.region, continent: c.continent,
    global_rank: c.global_rank, regional_rank: c.regional_rank,
    usa_rank: c.usa_rank, country_rank: c.country_rank,
    thumbnail_image: c.thumbnail_image, latitude: c.latitude, longitude: c.longitude,
    website_url: c.website_url, description: c.description, created_at: c.created_at,
    avg_rating: ratings.get(c.id)?.avg_overall_score ?? null,
    review_count: ratings.get(c.id)?.review_count ?? null,
    country_code: c.country_code, course_type: c.course_type,
    has_hosted_major: c.has_hosted_major, top100_url: c.top100_url,
  };
}

async function fetchCourses(search: string, country: string, page: number, pageSize: number) {
  let q = supabase.from('golf_courses').select(COURSE_COLUMNS, { count: 'exact' });
  if (search.trim()) {
    const s = search.trim();
    q = q.or(`name.ilike.%${s}%,country.ilike.%${s}%,sub_country.ilike.%${s}%`);
  }
  if (country && country !== 'all') q = q.eq('country', country);
  q = q.order('name', { ascending: true });
  const from = (page - 1) * pageSize;
  q = q.range(from, from + pageSize - 1);

  const { data, error, count } = await q;
  if (error) throw error;

  const ids = (data ?? []).map((c: any) => c.id);
  const ratings = new Map<string, RatingAgg>();
  if (ids.length) {
    const { data: r } = await (supabase
      .from('course_rating_aggregates' as any)
      .select('course_id, avg_overall_score, review_count')
      .in('course_id', ids) as any as Promise<{ data: RatingAgg[] | null }>);
    (r ?? []).forEach(x => ratings.set(x.course_id, x));
  }
  return { courses: (data ?? []).map((c: any) => mapRow(c, ratings)), total: count ?? 0 };
}

async function fetchCountries(): Promise<string[]> {
  // Use stats-level aggregation: fetch distinct via grouping fallback (raw select).
  const { data, error } = await supabase
    .from('golf_courses')
    .select('country')
    .not('country', 'is', null)
    .order('country', { ascending: true })
    .limit(1000);
  if (error) return [];
  const set = new Set<string>();
  (data ?? []).forEach((r: any) => r.country && set.add(r.country));
  return Array.from(set).sort();
}

export type CourseUpdate = Partial<Pick<AdminCourseRow,
  'name' | 'global_rank' | 'regional_rank' | 'usa_rank' | 'country_rank' |
  'website_url' | 'description' | 'top100_url' |
  'country' | 'sub_country' | 'region' |
  'latitude' | 'longitude' | 'country_code' |
  'course_type' | 'has_hosted_major'
>>;

export function useCourses() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const debounced = useDebouncedValue(search, 250);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-v2', 'courses', debounced, country, page],
    queryFn: () => fetchCourses(debounced, country, page, pageSize),
    staleTime: 60_000,
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['admin-v2', 'courses', 'countries'],
    queryFn: fetchCountries,
    staleTime: 5 * 60_000,
  });

  const { data: kpiStats } = useGolfCoursesStats();

  const stats = useMemo(() => ({
    total: kpiStats?.totalCourses ?? 0,
    geocoded: (kpiStats?.totalCourses ?? 0) - (kpiStats?.missingCoordinates ?? 0),
    missingCoords: kpiStats?.missingCoordinates ?? 0,
    top100: kpiStats?.verifiedCourses ?? 0,
  }), [kpiStats]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CourseUpdate }) => {
      const { error } = await supabase.from('golf_courses').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Course updated');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'courses'] });
    },
    onError: () => toast.error('Failed to update course'),
  });

  const photoMutation = useMutation({
    mutationFn: async ({ courseId, file }: { courseId: string; file: File }) => {
      const ext = file.name.split('.').pop();
      const path = `course-photos/${courseId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('course-images').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('course-images').getPublicUrl(path);
      const { error: updErr } = await supabase.from('golf_courses').update({ thumbnail_image: publicUrl }).eq('id', courseId);
      if (updErr) throw updErr;
      return publicUrl;
    },
    onSuccess: () => {
      toast.success('Photo updated');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'courses'] });
    },
    onError: () => toast.error('Failed to upload photo'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('secure-admin-operations', {
        body: { action: 'delete_course', courseId: id },
      });
      if (error) throw error;
      if (data?.error) {
        const e = new Error(data.reason ?? data.error) as any;
        e.counts = data.counts;
        throw e;
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Course deleted');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'courses'] });
    },
    onError: (err: any) => {
      if (err?.counts) toast.error('Cannot delete this course', { description: err.message, duration: 8000 });
      else toast.error('Failed to delete course');
    },
  });

  return {
    courses: data?.courses ?? [],
    total: data?.total ?? 0,
    isLoading,
    refetch,
    countries,
    stats,
    search, setSearch: (v: string) => { setSearch(v); setPage(1); },
    country, setCountry: (v: string) => { setCountry(v); setPage(1); },
    page, setPage, pageSize,
    updateCourse: (id: string, updates: CourseUpdate) => updateMutation.mutateAsync({ id, updates }),
    isUpdating: updateMutation.isPending,
    uploadPhoto: (courseId: string, file: File) => photoMutation.mutateAsync({ courseId, file }),
    isUploadingPhoto: photoMutation.isPending,
    deleteCourse: (id: string) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
  };
}

export async function createCourse(input: {
  name: string;
  country: string;
  continent: string;
  sub_country?: string;
  region?: string;
  website_url?: string;
  description?: string;
  latitude?: string;
  longitude?: string;
  course_type?: string;
  has_hosted_major: boolean;
}) {
  const { data, error } = await supabase
    .from('golf_courses')
    .insert({
      name: input.name.trim(),
      country: input.country.trim(),
      continent: input.continent as any,
      sub_country: input.sub_country || null,
      region: input.region || null,
      website_url: input.website_url || null,
      description: input.description || null,
      latitude: input.latitude ? parseFloat(input.latitude) : null,
      longitude: input.longitude ? parseFloat(input.longitude) : null,
      course_type: (input.course_type || null) as any,
      has_hosted_major: input.has_hosted_major,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}
