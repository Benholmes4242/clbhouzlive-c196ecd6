import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TriageCounts {
  moderationReports: number;
  suspensionAppeals: number;
  businessVerifications: number;
  golferVerifications: number;
  courseClaims: number;
  courseRequests: number;
  matchRequests: number;
  supportAwaitingReply: number;
  total: number;
}

async function fetchTriageCounts(): Promise<TriageCounts> {
  const sb: any = supabase;
  const [
    reports,
    appeals,
    biz,
    golfer,
    claims,
    courseReqs,
    matchReqs,
    supportAwaiting,
  ] = await Promise.all([
    sb.from('reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
    sb.from('suspension_appeals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('business_verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('golfer_verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('course_claim_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('course_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('whs_course_match_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    sb
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('last_sender', 'user')
      .not('status', 'in', '(resolved,closed)'),
  ]);

  const c: TriageCounts = {
    moderationReports: reports.count ?? 0,
    suspensionAppeals: appeals.count ?? 0,
    businessVerifications: biz.count ?? 0,
    golferVerifications: golfer.count ?? 0,
    courseClaims: claims.count ?? 0,
    courseRequests: courseReqs.count ?? 0,
    matchRequests: matchReqs.count ?? 0,
    supportAwaitingReply: supportAwaiting.count ?? 0,
    total: 0,
  };
  c.total =
    c.moderationReports +
    c.suspensionAppeals +
    c.businessVerifications +
    c.golferVerifications +
    c.courseClaims +
    c.courseRequests +
    c.matchRequests +
    c.supportAwaitingReply;
  return c;
}

export function useTriageCounts() {
  return useQuery({
    queryKey: ['admin-v2', 'dashboard', 'triage-counts'],
    queryFn: fetchTriageCounts,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
