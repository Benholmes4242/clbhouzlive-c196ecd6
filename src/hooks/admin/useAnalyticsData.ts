import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DateRange = '24h' | '7d' | '14d' | '30d';

interface OverviewKPIs {
  totalEvents: { value: number; change: number };
  uniqueUsers: { value: number; change: number };
  eventsPerUser: { value: number; change: number };
  totalPosts: { value: number; change: number };
}

interface EventTypeBreakdown {
  name: string;
  count: number;
}

interface TimeSeriesPoint {
  date: string;
  events: number;
  users: number;
  posts: number;
}

interface TopContent {
  mostViewedPosts: Array<{ id: string; title: string; views: number }>;
  mostReviewedCourses: Array<{ id: string; name: string; reviews: number }>;
  mostActiveUsers: Array<{ id: string; username: string; actions: number }>;
}

function getIntervalForRange(range: DateRange): string {
  switch (range) {
    case '24h': return '24 hours';
    case '7d': return '7 days';
    case '14d': return '14 days';
    case '30d': return '30 days';
  }
}

function getPreviousIntervalForRange(range: DateRange): { start: string; end: string } {
  const now = new Date();
  let daysBack: number;
  
  switch (range) {
    case '24h': daysBack = 1; break;
    case '7d': daysBack = 7; break;
    case '14d': daysBack = 14; break;
    case '30d': daysBack = 30; break;
  }
  
  const previousEnd = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const previousStart = new Date(previousEnd.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  return {
    start: previousStart.toISOString(),
    end: previousEnd.toISOString()
  };
}

export function useAnalyticsOverview(range: DateRange) {
  return useQuery({
    queryKey: ['admin-analytics-overview', range],
    queryFn: async (): Promise<OverviewKPIs> => {
      const interval = getIntervalForRange(range);
      const previous = getPreviousIntervalForRange(range);
      
      // Parallel queries for current period
      const [eventsResult, usersResult, postsResult] = await Promise.all([
        // Current events
        supabase
          .from('analytics_events')
          .select('id, user_id', { count: 'exact', head: false })
          .gte('created_at', `now() - interval '${interval}'`),
        
        // Current users (signups)
        supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', `now() - interval '${interval}'`),
        
        // Current posts
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', `now() - interval '${interval}'`)
      ]);
      
      // Previous period queries for comparison
      const [prevEventsResult, prevUsersResult, prevPostsResult] = await Promise.all([
        supabase
          .from('analytics_events')
          .select('id, user_id', { count: 'exact', head: false })
          .gte('created_at', previous.start)
          .lt('created_at', previous.end),
        
        supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', previous.start)
          .lt('created_at', previous.end),
        
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', previous.start)
          .lt('created_at', previous.end)
      ]);
      
      const currentEvents = eventsResult.count ?? 0;
      const prevEvents = prevEventsResult.count ?? 0;
      
      // Calculate unique users from events data
      const currentUniqueUsers = new Set(eventsResult.data?.map(e => e.user_id).filter(Boolean)).size;
      const prevUniqueUsers = new Set(prevEventsResult.data?.map(e => e.user_id).filter(Boolean)).size;
      
      const currentPosts = postsResult.count ?? 0;
      const prevPosts = prevPostsResult.count ?? 0;
      
      const eventsPerUser = currentUniqueUsers > 0 ? currentEvents / currentUniqueUsers : 0;
      const prevEventsPerUser = prevUniqueUsers > 0 ? prevEvents / prevUniqueUsers : 0;
      
      const calculateChange = (current: number, prev: number): number => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - prev) / prev) * 100);
      };
      
      return {
        totalEvents: {
          value: currentEvents,
          change: calculateChange(currentEvents, prevEvents)
        },
        uniqueUsers: {
          value: currentUniqueUsers,
          change: calculateChange(currentUniqueUsers, prevUniqueUsers)
        },
        eventsPerUser: {
          value: Math.round(eventsPerUser * 10) / 10,
          change: calculateChange(eventsPerUser, prevEventsPerUser)
        },
        totalPosts: {
          value: currentPosts,
          change: calculateChange(currentPosts, prevPosts)
        }
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useEventTypeBreakdown(range: DateRange) {
  return useQuery({
    queryKey: ['admin-analytics-events-breakdown', range],
    queryFn: async (): Promise<EventTypeBreakdown[]> => {
      const interval = getIntervalForRange(range);
      
      // Since we can't do GROUP BY in supabase-js easily, fetch and aggregate client-side
      const { data, error } = await supabase
        .from('analytics_events')
        .select('name')
        .gte('created_at', `now() - interval '${interval}'`);
      
      if (error) throw error;
      
      // Aggregate by event name
      const counts: Record<string, number> = {};
      data?.forEach(event => {
        counts[event.name] = (counts[event.name] || 0) + 1;
      });
      
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 60 * 1000,
  });
}

export function useAnalyticsTimeSeries(range: DateRange) {
  return useQuery({
    queryKey: ['admin-analytics-timeseries', range],
    queryFn: async (): Promise<TimeSeriesPoint[]> => {
      const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '14d' ? 14 : 30;
      const points: TimeSeriesPoint[] = [];
      
      // Generate date range
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        points.push({
          date: date.toISOString().split('T')[0],
          events: 0,
          users: 0,
          posts: 0
        });
      }
      
      // Fetch events by day
      const [eventsData, postsData] = await Promise.all([
        supabase
          .from('analytics_events')
          .select('created_at, user_id')
          .gte('created_at', points[0]?.date ?? new Date().toISOString()),
        
        supabase
          .from('posts')
          .select('created_at')
          .gte('created_at', points[0]?.date ?? new Date().toISOString())
      ]);
      
      // Aggregate events and users by date
      eventsData.data?.forEach(event => {
        const eventDate = new Date(event.created_at).toISOString().split('T')[0];
        const point = points.find(p => p.date === eventDate);
        if (point) {
          point.events++;
          if (event.user_id) point.users++;
        }
      });
      
      // Aggregate posts by date
      postsData.data?.forEach(post => {
        const postDate = new Date(post.created_at).toISOString().split('T')[0];
        const point = points.find(p => p.date === postDate);
        if (point) point.posts++;
      });
      
      return points;
    },
    staleTime: 60 * 1000,
  });
}

export function useTopContent(range: DateRange) {
  return useQuery({
    queryKey: ['admin-analytics-top-content', range],
    queryFn: async (): Promise<TopContent> => {
      const interval = getIntervalForRange(range);
      
      const [postsData, coursesData, usersData] = await Promise.all([
        // Most liked posts
        supabase
          .from('posts')
          .select('id, content, like_count')
          .gte('created_at', `now() - interval '${interval}'`)
          .order('like_count', { ascending: false })
          .limit(5),
        
        // Most reviewed courses
        supabase
          .from('course_ratings')
          .select('course_id, golf_courses(id, name)')
          .gte('created_at', `now() - interval '${interval}'`),
        
        // Most active users (by post count)
        supabase
          .from('posts')
          .select('user_id, user_profiles(id, username)')
          .gte('created_at', `now() - interval '${interval}'`)
      ]);
      
      // Aggregate course reviews
      const courseCounts: Record<string, { name: string; count: number }> = {};
      coursesData.data?.forEach((r: any) => {
        const courseId = r.course_id;
        const courseName = r.golf_courses?.name || 'Unknown';
        if (!courseCounts[courseId]) {
          courseCounts[courseId] = { name: courseName, count: 0 };
        }
        courseCounts[courseId].count++;
      });
      
      // Aggregate user posts
      const userCounts: Record<string, { username: string; count: number }> = {};
      usersData.data?.forEach((p: any) => {
        const userId = p.user_id;
        const username = p.user_profiles?.username || 'Unknown';
        if (!userCounts[userId]) {
          userCounts[userId] = { username, count: 0 };
        }
        userCounts[userId].count++;
      });
      
      return {
        mostViewedPosts: (postsData.data || []).map((p: any) => ({
          id: p.id,
          title: p.content?.slice(0, 50) || 'Untitled',
          views: p.like_count || 0
        })),
        mostReviewedCourses: Object.entries(courseCounts)
          .map(([id, data]) => ({ id, name: data.name, reviews: data.count }))
          .sort((a, b) => b.reviews - a.reviews)
          .slice(0, 5),
        mostActiveUsers: Object.entries(userCounts)
          .map(([id, data]) => ({ id, username: data.username, actions: data.count }))
          .sort((a, b) => b.actions - a.actions)
          .slice(0, 5)
      };
    },
    staleTime: 60 * 1000,
  });
}
