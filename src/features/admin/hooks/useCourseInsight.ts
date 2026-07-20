import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Props keys verified against callsites:
// - course_view: src/pages/CourseDetailPage.tsx L29-31 => { course_id }.

export interface CourseInsight {
  views: {
    total: number;
    daily: { date: string; count: number }[]; // 30 days
  };
  rating: {
    average: number | null;
    count: number;
    design: number | null;
    condition: number | null;
    facilities: number | null;
    clubhouse: number | null;
  };
  trend12w: { week: string; avg: number | null; count: number }[];
  reviewsThisMonth: number;
  reviewsLastMonth: number;
  courseName: string | null;
}

const DAY_MS = 86_400_000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const avg = (nums: number[]) => (nums.length === 0 ? null : Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10);

export function useCourseInsight(courseId: string | null) {
  return useQuery({
    queryKey: ['admin-v2', 'course-insight', courseId],
    enabled: !!courseId,
    staleTime: 60_000,
    queryFn: async (): Promise<CourseInsight> => {
      const now = new Date();
      const since30d = new Date(now.getTime() - 30 * DAY_MS).toISOString();
      const since84d = new Date(now.getTime() - 84 * DAY_MS).toISOString();

      // Parallel: views (bounded), ratings (bounded via 84d window for trend
      // + reviews-per-month), and course name.
      const [viewsRes, ratingsRes, allRatingsRes, courseRes] = await Promise.all([
        supabase
          .from('analytics_events')
          .select('created_at')
          .eq('name', 'course_view')
          .contains('props', { course_id: courseId })
          .gte('created_at', since30d)
          .limit(20000),
        // All-time aggregates via bounded page; we cap at 5000 which is far
        // beyond any single course's rating count in practice.
        supabase
          .from('course_ratings')
          .select('rating, design_score, condition_score, facilities_score, clubhouse_score')
          .eq('course_id', courseId!)
          .eq('is_mock', false)
          .limit(5000),
        // 12-week trend + this/last month deltas share this window.
        supabase
          .from('course_ratings')
          .select('rating, created_at')
          .eq('course_id', courseId!)
          .eq('is_mock', false)
          .gte('created_at', since84d)
          .order('created_at', { ascending: true })
          .limit(5000),
        supabase.from('golf_courses').select('name').eq('id', courseId!).maybeSingle(),
      ]);

      // 30d views bucket
      const viewRows = (viewsRes.data ?? []) as { created_at: string }[];
      const dayBuckets = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        dayBuckets.set(isoDay(new Date(now.getTime() - i * DAY_MS)), 0);
      }
      for (const r of viewRows) {
        const k = r.created_at.slice(0, 10);
        if (dayBuckets.has(k)) dayBuckets.set(k, (dayBuckets.get(k) ?? 0) + 1);
      }

      // Rating averages
      const ratingRows = (ratingsRes.data ?? []) as {
        rating: number;
        design_score: number | null;
        condition_score: number | null;
        facilities_score: number | null;
        clubhouse_score: number | null;
      }[];
      const nums = (k: keyof typeof ratingRows[number]) =>
        ratingRows.map(r => r[k]).filter((v): v is number => typeof v === 'number');
      const ratingAvg = avg(nums('rating'));

      // 12-week trend
      const weekBuckets = new Map<string, { sum: number; n: number }>();
      const weekLabels: string[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 7 * DAY_MS);
        const k = isoDay(d);
        weekLabels.push(k);
        weekBuckets.set(k, { sum: 0, n: 0 });
      }
      const weekIndex = (created: string): string | null => {
        const t = new Date(created).getTime();
        for (let i = weekLabels.length - 1; i >= 0; i--) {
          if (new Date(weekLabels[i]).getTime() <= t) return weekLabels[i];
        }
        return null;
      };
      const trendRows = (allRatingsRes.data ?? []) as { rating: number; created_at: string }[];
      for (const r of trendRows) {
        const k = weekIndex(r.created_at);
        if (!k) continue;
        const b = weekBuckets.get(k)!;
        b.sum += r.rating;
        b.n += 1;
      }
      const trend12w = weekLabels.map(k => {
        const b = weekBuckets.get(k)!;
        return { week: k, avg: b.n ? Math.round((b.sum / b.n) * 10) / 10 : null, count: b.n };
      });

      // Reviews this month vs last (calendar-agnostic - 30d rolling windows).
      const nowMs = now.getTime();
      let reviewsThisMonth = 0;
      let reviewsLastMonth = 0;
      for (const r of trendRows) {
        const t = new Date(r.created_at).getTime();
        const ageDays = (nowMs - t) / DAY_MS;
        if (ageDays <= 30) reviewsThisMonth += 1;
        else if (ageDays <= 60) reviewsLastMonth += 1;
      }

      return {
        views: {
          total: viewRows.length,
          daily: Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count })),
        },
        rating: {
          average: ratingAvg,
          count: ratingRows.length,
          design: avg(nums('design_score')),
          condition: avg(nums('condition_score')),
          facilities: avg(nums('facilities_score')),
          clubhouse: avg(nums('clubhouse_score')),
        },
        trend12w,
        reviewsThisMonth,
        reviewsLastMonth,
        courseName: (courseRes.data as { name: string | null } | null)?.name ?? null,
      };
    },
  });
}
