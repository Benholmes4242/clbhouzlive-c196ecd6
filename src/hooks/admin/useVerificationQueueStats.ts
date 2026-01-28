import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';

export interface VerificationQueueStats {
  totalPending: number;
  businessPending: number;
  golferPending: number;
  approvedToday: number;
  rejectedToday: number;
}

export function useVerificationQueueStats() {
  return useQuery({
    queryKey: ['verification-queue-stats'],
    queryFn: async (): Promise<VerificationQueueStats> => {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      // Parallel queries for efficiency
      const [
        businessPendingRes,
        golferPendingRes,
        businessApprovedTodayRes,
        golferApprovedTodayRes,
        businessRejectedTodayRes,
        golferRejectedTodayRes,
      ] = await Promise.all([
        // Business pending
        supabase
          .from('business_verification_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        // Golfer pending
        supabase
          .from('golfer_verification_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        // Business approved today
        supabase
          .from('business_verification_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('reviewed_at', startOfToday)
          .lte('reviewed_at', endOfToday),
        // Golfer approved today
        supabase
          .from('golfer_verification_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('reviewed_at', startOfToday)
          .lte('reviewed_at', endOfToday),
        // Business rejected today
        supabase
          .from('business_verification_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'rejected')
          .gte('reviewed_at', startOfToday)
          .lte('reviewed_at', endOfToday),
        // Golfer rejected today
        supabase
          .from('golfer_verification_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'rejected')
          .gte('reviewed_at', startOfToday)
          .lte('reviewed_at', endOfToday),
      ]);

      const businessPending = businessPendingRes.count ?? 0;
      const golferPending = golferPendingRes.count ?? 0;
      const approvedToday = (businessApprovedTodayRes.count ?? 0) + (golferApprovedTodayRes.count ?? 0);
      const rejectedToday = (businessRejectedTodayRes.count ?? 0) + (golferRejectedTodayRes.count ?? 0);

      return {
        totalPending: businessPending + golferPending,
        businessPending,
        golferPending,
        approvedToday,
        rejectedToday,
      };
    },
    staleTime: 30_000,
  });
}
