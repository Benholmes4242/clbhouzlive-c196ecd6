import { useQuery, useQueries } from '@tanstack/react-query';
import { useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { searchAnalytics } from '@/utils/searchAnalytics';
import { VIDEO_DURATION_THRESHOLD_SECONDS } from '@/constants/videoRules';

// Types for search results
export interface PersonResult {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  verified?: boolean;
  home_club_name?: string | null;
  is_public?: boolean | null;
  type: 'user';
}

export interface ClubResult {
  id: string;
  name: string;
  slug?: string;
  logo_url: string | null;
  city?: string | null;
  country: string;
  region?: string | null;
  global_rank?: number | null;
  user_has_rated?: boolean;
  type: 'course';
}

export interface VideoResult {
  id: string;
  title: string;
  thumbnail_url: string | null;
  creator_name: string;
  creator_id: string;
  duration: string;
  views: number;
  type: 'video';
}

export interface PageResult {
  id: string;
  name: string;
  slug?: string;
  logo_url: string | null;
  verified?: boolean;
  type: 'page';
}

export interface BusinessResult {
  id: string;
  name: string;
  slug?: string;
  logo_url: string | null;
  city?: string | null;
  country?: string | null;
  location?: string | null;
  verified?: boolean;
  type: 'business';
}

export interface TrendingItem {
  label: string;
  type: 'people' | 'clubs' | 'pages' | 'videos';
  id?: string;
  image?: string | null;
  subtitle?: string;
}

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

export interface GlobalSearchResults {
  people: PersonResult[];
  clubs: ClubResult[];
  videos: VideoResult[];
  pages: PageResult[];
  businesses: BusinessResult[];
  trending: TrendingItem[];
  trendingLoading: boolean;
  isLoading: boolean;
  error?: Error | null;
}

export interface UseGlobalEntitySearchProps {
  query: string;
  enabled?: boolean;
  limits?: {
    people?: number;
    clubs?: number;
    videos?: number;
    pages?: number;
    businesses?: number;
  };
}

// Search functions with optimized queries and limits
const searchPeople = async (query: string, limit: number = 6): Promise<PersonResult[]> => {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      display_name,
      username,
      profile_photo_url,
      home_club,
      is_public
    `)
    .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
    .order('display_name')
    .limit(Math.min(limit, 8)); // Performance: cap each section at 8 items

  if (error) {
    console.error('Error searching people:', error);
    throw new Error('Failed to search people');
  }

  return (data || []).map(user => ({
    id: user.id,
    display_name: user.display_name || user.username || 'Anonymous User',
    username: user.username,
    avatar_url: user.profile_photo_url,
    home_club_name: user.home_club,
    is_public: user.is_public,
    type: 'user' as const
  }));
};

const searchClubs = async (query: string, limit: number = 6, userId?: string): Promise<ClubResult[]> => {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('golf_courses')
    .select(`
      id,
      name,
      country,
      region,
      thumbnail_image,
      global_rank
    `)
    .ilike('name', `%${query}%`)
    .order('global_rank', { ascending: true, nullsFirst: false })
    .limit(Math.min(limit, 8)); // Performance: cap each section at 8 items

  if (error) {
    console.error('Error searching clubs:', error);
    throw new Error('Failed to search clubs');
  }

  const courses = (data || []).map(course => ({
    id: course.id,
    name: course.name,
    logo_url: course.thumbnail_image,
    country: course.country,
    region: course.region,
    global_rank: course.global_rank,
    user_has_rated: false,
    type: 'course' as const
  }));

  // Batch check which courses the user has rated
  if (userId && courses.length > 0) {
    const courseIds = courses.map(c => c.id);
    const { data: userRatings } = await supabase
      .from('course_ratings')
      .select('course_id')
      .eq('user_id', userId)
      .in('course_id', courseIds);

    const ratedSet = new Set(userRatings?.map(r => r.course_id) ?? []);
    courses.forEach(c => { c.user_has_rated = ratedSet.has(c.id); });
  }

  return courses;
};

// Format duration helper
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const searchVideos = async (query: string, limit: number = 6): Promise<VideoResult[]> => {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      user_id,
      post_media!inner(
        media_url,
        duration_seconds,
        poster_url,
        filter_id,
        studio_edits
      ),
      user_profiles!posts_user_id_fkey(
        id,
        display_name,
        username
      ),
      post_views(count)
    `)
    .eq('post_media.media_type', 'video')
    .gte('post_media.duration_seconds', VIDEO_DURATION_THRESHOLD_SECONDS)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 8));

  if (error) {
    console.error('Error searching videos:', error);
    throw new Error('Failed to search videos');
  }

  return (data || []).map((post: any) => {
    const media = post.post_media?.[0];
    const user = post.user_profiles;

    return {
      id: post.id,
      title: post.content?.split('\n')[0]?.substring(0, 80) || 'Untitled Video',
      thumbnail_url: media?.poster_url || null,
      creator_name: user?.display_name || user?.username || 'Unknown',
      creator_id: post.user_id,
      duration: formatDuration(media?.duration_seconds || 0),
      views: post.post_views?.[0]?.count || 0,
      type: 'video' as const
    };
  });
};

const searchPages = async (query: string, limit: number = 6): Promise<PageResult[]> => {
  // For now, return empty array as pages/channels aren't implemented
  // This can be extended when pages/channels are added to the database
  return [];
};

const searchBusinesses = async (query: string, limit: number = 6): Promise<BusinessResult[]> => {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('business_accounts')
    .select('id, name, slug, city, country, location, logo_url, is_verified')
    .ilike('name', `%${query}%`)
    .eq('is_deleted', false)
    .order('name')
    .limit(Math.min(limit, 8));

  if (error) {
    console.error('Error searching businesses:', error);
    throw new Error('Failed to search businesses');
  }

  return (data || []).map(business => ({
    id: business.id,
    name: business.name,
    slug: business.slug || undefined,
    logo_url: business.logo_url,
    city: business.city,
    country: business.country,
    location: business.location,
    verified: business.is_verified || false,
    type: 'business' as const
  }));
};

// Get recent searches from localStorage
export const getRecentSearches = (): RecentSearch[] => {
  try {
    const stored = localStorage.getItem('recent_searches');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.slice(0, 8); // Keep only 8 most recent
    }
  } catch (error) {
    console.error('Error loading recent searches:', error);
  }
  return [];
};

// Daily seed for consistent shuffling throughout the day
const getDailySeed = (): number => {
  const today = new Date();
  return today.getFullYear() * 10000 + 
         (today.getMonth() + 1) * 100 + 
         today.getDate();
};

// Seeded random function for daily-consistent shuffling
const seededRandom = (seed: number): (() => number) => {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

// Shuffle array with daily seed for consistent daily picks
const dailyShuffle = <T,>(array: T[]): T[] => {
  const random = seededRandom(getDailySeed());
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Get trending items (popular courses) with daily rotation
const getTrendingItems = async (): Promise<TrendingItem[]> => {
  try {
    // Fetch a larger pool of courses to enable meaningful daily rotation
    const { data, error } = await supabase
      .from('golf_courses')
      .select('id, name, global_rank, thumbnail_image, country, region')
      .not('global_rank', 'is', null)
      .lte('global_rank', 200) // Top 200 courses for a good pool
      .order('global_rank', { ascending: true })
      .limit(50);

    if (error) throw error;

    const allCourses = (data || []).map(course => ({
      label: course.name,
      type: 'clubs' as const,
      id: course.id,
      image: course.thumbnail_image,
      subtitle: `${course.region ? `${course.region}, ` : ''}${course.country}${course.global_rank ? ` • #${course.global_rank}` : ''}`
    }));

    // Apply daily shuffle and take top picks for the day
    return dailyShuffle(allCourses).slice(0, 8);
  } catch (error) {
    console.error('Error loading trending items:', error);
    return [];
  }
};

// Main hook
export const useGlobalEntitySearch = ({
  query,
  enabled = true,
  limits = { people: 6, clubs: 6, videos: 6, pages: 6, businesses: 6 }
}: UseGlobalEntitySearchProps): GlobalSearchResults => {
  const { user } = useSupabaseSession();
  // Track query changes for analytics
  const prevQuery = useRef<string>('');
  useEffect(() => {
    if (query !== prevQuery.current && query.trim()) {
      searchAnalytics.searchQueryChanged(query);
      prevQuery.current = query;
    }
  }, [query]);

  const hasQuery = query.trim().length > 0;
  const normalizedQuery = query.trim().toLowerCase();

  // Get trending items
  const trendingQuery = useQuery({
    queryKey: ['global-search', 'trending'],
    queryFn: getTrendingItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v4+)
    enabled: enabled && !hasQuery
  });

  // Individual search queries - more predictable than useQueries
  const peopleQuery = useQuery({
    queryKey: ['global-search', 'people', normalizedQuery],
    queryFn: () => searchPeople(normalizedQuery, limits.people || 6),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && hasQuery
  });

  const clubsQuery = useQuery({
    queryKey: ['global-search', 'clubs', normalizedQuery, user?.id],
    queryFn: () => searchClubs(normalizedQuery, limits.clubs || 6, user?.id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && hasQuery
  });

  const videosQuery = useQuery({
    queryKey: ['global-search', 'videos', normalizedQuery],
    queryFn: () => searchVideos(normalizedQuery, limits.videos || 6),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: false, // Not displayed in overlay — disable until implemented
  });

  const pagesQuery = useQuery({
    queryKey: ['global-search', 'pages', normalizedQuery],
    queryFn: () => searchPages(normalizedQuery, limits.pages || 6),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: false, // Not displayed in overlay — disable until implemented
  });

  const businessesQuery = useQuery({
    queryKey: ['global-search', 'businesses', normalizedQuery],
    queryFn: () => searchBusinesses(normalizedQuery, limits.businesses || 6),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && hasQuery
  });

  // Extract results
  const people = peopleQuery.data || [];
  const clubs = clubsQuery.data || [];
  const videos = videosQuery.data || [];
  const pages = pagesQuery.data || [];
  const businesses = businessesQuery.data || [];

  // Loading state
  const isLoading = hasQuery 
    ? (peopleQuery.isLoading || clubsQuery.isLoading || businessesQuery.isLoading)
    : trendingQuery.isLoading;

  // Error handling
  const error = hasQuery
    ? (peopleQuery.error || clubsQuery.error || videosQuery.error || pagesQuery.error || businessesQuery.error)
    : trendingQuery.error;

  const trending = trendingQuery.data || [];

  const allResultsEmpty = people.length === 0 && clubs.length === 0 && videos.length === 0 && pages.length === 0 && businesses.length === 0;
  
  // Track no results for analytics
  useEffect(() => {
    if (query.trim() && !isLoading && allResultsEmpty) {
      searchAnalytics.searchNoResults(query);
    }
  }, [query, isLoading, allResultsEmpty]);

  return {
    people,
    clubs,
    videos,
    pages,
    businesses,
    trending,
    trendingLoading: trendingQuery.isLoading,
    isLoading,
    error: error || null
  };
};

// Save recent search utility
export const saveRecentSearch = (query: string) => {
  if (!query.trim()) return;

  const newSearch: RecentSearch = {
    id: Date.now().toString(),
    query: query.trim(),
    timestamp: Date.now()
  };

  const existing = getRecentSearches();
  const updated = [
    newSearch,
    ...existing.filter(s => s.query.toLowerCase() !== query.trim().toLowerCase())
  ].slice(0, 8);

  localStorage.setItem('recent_searches', JSON.stringify(updated));
};

// Clear recent searches utility
export const clearRecentSearches = () => {
  localStorage.removeItem('recent_searches');
};