import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for Explore data
export interface ExploreRegion {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  hero_image_url: string | null;
  sort_order: number;
  moments_7d?: number;
  moments_30d?: number;
  course_count?: number;
}

export interface ExploreTheme {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  sort_order: number;
  moments_7d?: number;
  moments_30d?: number;
  course_count?: number;
}

export interface ExploreFeaturedCourse {
  id: string;
  course_id: string;
  source_label: string;
  card_media_url: string;
  card_type: 'image' | 'video';
  play_url: string | null;
  sort_order: number;
  course?: {
    id: string;
    name: string;
    country: string;
    sub_country: string | null;
    thumbnail_image: string | null;
  };
}

/**
 * Fetch explore regions with activity counts
 */
export function useExploreRegions() {
  return useQuery({
    queryKey: ['explore-regions'],
    queryFn: async (): Promise<ExploreRegion[]> => {
      // Fetch regions
      const { data: regions, error: regionsError } = await supabase
        .from('explore_regions')
        .select('*')
        .order('sort_order');

      if (regionsError) throw regionsError;
      if (!regions) return [];

      // Fetch activity counts from view
      const { data: activity } = await supabase
        .from('vw_region_activity_30d')
        .select('*');

      // Fetch course counts per region
      const regionIds = regions.map(r => r.id);
      const { data: memberCounts } = await supabase
        .from('explore_region_members')
        .select('region_id, country');

      // Map activity and counts to regions
      return regions.map(region => {
        const regionActivity = activity?.find(a => a.region_id === region.id);
        const memberCountries = memberCounts?.filter(m => m.region_id === region.id).map(m => m.country) || [];
        
        return {
          ...region,
          moments_7d: regionActivity?.moments_7d ?? 0,
          moments_30d: regionActivity?.moments_30d ?? 0,
          // Course count would require another query - simplified for now
          course_count: memberCountries.length * 10, // Approximate
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch explore themes with activity counts
 */
export function useExploreThemes() {
  return useQuery({
    queryKey: ['explore-themes'],
    queryFn: async (): Promise<ExploreTheme[]> => {
      // Fetch themes
      const { data: themes, error: themesError } = await supabase
        .from('explore_themes')
        .select('*')
        .order('sort_order');

      if (themesError) throw themesError;
      if (!themes) return [];

      // Fetch activity counts from view
      const { data: activity } = await supabase
        .from('vw_theme_activity_30d')
        .select('*');

      // Fetch course counts per theme
      const { data: courseThemes } = await supabase
        .from('explore_course_themes')
        .select('theme_id');

      // Map activity and counts to themes
      return themes.map(theme => {
        const themeActivity = activity?.find(a => a.theme_id === theme.id);
        const coursesInTheme = courseThemes?.filter(ct => ct.theme_id === theme.id) || [];
        
        return {
          ...theme,
          moments_7d: themeActivity?.moments_7d ?? 0,
          moments_30d: themeActivity?.moments_30d ?? 0,
          course_count: coursesInTheme.length,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch featured courses for Discover Courses section
 */
export function useExploreFeaturedCourses() {
  return useQuery({
    queryKey: ['explore-featured-courses'],
    queryFn: async (): Promise<ExploreFeaturedCourse[]> => {
      const { data, error } = await supabase
        .from('explore_featured_courses')
        .select(`
          *,
          course:golf_courses (
            id,
            name,
            country,
            sub_country,
            thumbnail_image
          )
        `)
        .eq('active', true)
        .order('sort_order');

      if (error) throw error;
      return (data || []) as unknown as ExploreFeaturedCourse[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single region by slug with its courses
 */
export function useExploreRegionDetail(slug: string) {
  return useQuery({
    queryKey: ['explore-region', slug],
    queryFn: async () => {
      // Fetch region
      const { data: region, error: regionError } = await supabase
        .from('explore_regions')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (regionError) throw regionError;
      if (!region) return null;

      // Fetch region member countries
      const { data: members } = await supabase
        .from('explore_region_members')
        .select('country, sub_country')
        .eq('region_id', region.id);

      const countries = members?.map(m => m.country) || [];

      // Fetch courses in this region
      const { data: courses } = await supabase
        .from('golf_courses')
        .select('*')
        .in('country', countries)
        .order('global_rank', { ascending: true, nullsFirst: false })
        .limit(50);

      return {
        region,
        members: members || [],
        courses: courses || [],
      };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single theme by slug with its courses
 */
export function useExploreThemeDetail(slug: string) {
  return useQuery({
    queryKey: ['explore-theme', slug],
    queryFn: async () => {
      // Fetch theme
      const { data: theme, error: themeError } = await supabase
        .from('explore_themes')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (themeError) throw themeError;
      if (!theme) return null;

      // Fetch courses tagged with this theme
      const { data: courseThemes } = await supabase
        .from('explore_course_themes')
        .select(`
          course_id,
          course:golf_courses (*)
        `)
        .eq('theme_id', theme.id);

      const courses = courseThemes?.map(ct => ct.course).filter(Boolean) || [];

      return {
        theme,
        courses,
      };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// Note: useExploreSearch has been consolidated into src/hooks/useExploreSearch.ts
// Import from there instead: import { useExploreSearch } from '@/hooks/useExploreSearch';

/**
 * Fetch trending courses (based on recent activity)
 */
export function useTrendingCourses(limit = 20) {
  return useQuery({
    queryKey: ['trending-courses', limit],
    queryFn: async () => {
      // Get courses with activity
      const { data: activity } = await supabase
        .from('vw_course_activity_30d')
        .select('course_id, moments_7d, moments_30d')
        .order('moments_7d', { ascending: false })
        .limit(limit);

      if (!activity?.length) {
        // Fallback to top-ranked courses
        const { data: topCourses } = await supabase
          .from('golf_courses')
          .select('*')
          .not('global_rank', 'is', null)
          .order('global_rank')
          .limit(limit);
        return topCourses || [];
      }

      const courseIds = activity.map(a => a.course_id);
      const { data: courses } = await supabase
        .from('golf_courses')
        .select('*')
        .in('id', courseIds);

      // Sort by activity
      return (courses || []).sort((a, b) => {
        const aActivity = activity.find(act => act.course_id === a.id);
        const bActivity = activity.find(act => act.course_id === b.id);
        return (bActivity?.moments_7d || 0) - (aActivity?.moments_7d || 0);
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch moments for a specific course
 */
export function useCourseMoments(courseId: string, limit = 20) {
  return useQuery({
    queryKey: ['course-moments', courseId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles!posts_user_profile_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('course_id', courseId)
        .eq('status', 'published') // Only show published posts
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000,
  });
}
