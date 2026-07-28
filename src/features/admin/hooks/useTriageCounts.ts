import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type InboxTypeSlug =
  | 'report'
  | 'appeal'
  | 'support'
  | 'verification'
  | 'approval'
  | 'match'
  | 'courseRequest'
  | 'unmatchedCourse'
  | 'holePhoto';

export interface TriageQueueBucket {
  key: string;
  label: string;
  count: number;
  type: InboxTypeSlug;
  route: string;
  oldestCreatedAt: string | null;
}

export interface TriageCounts {
  moderationReports: number; // reports + post_reports
  reports: number;
  postReports: number;
  suspensionAppeals: number;
  businessVerifications: number;
  golferVerifications: number;
  courseClaims: number;
  courseRequests: number;
  matchRequests: number;
  unmatchedCourses: number;
  holePhotos: number;
  supportAwaitingReply: number;
  approvals: number;
  total: number;
  byQueue: TriageQueueBucket[];
  oldestCreatedAt: string | null;
  oldestQueueRoute: string; // now an inbox link
  oldestType: InboxTypeSlug | null;
  hadErrors: boolean;
}

type QueueSpec = {
  key: string;
  label: string;
  type: InboxTypeSlug;
  countBuilder: () => any;
  oldestBuilder: () => any;
};

const sb: any = supabase;

const inboxRoute = (type: InboxTypeSlug) => `/admin-v2/inbox?type=${type}`;

const QUEUES: QueueSpec[] = [
  {
    key: 'reports', label: 'User reports', type: 'report',
    countBuilder: () => sb.from('reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
    oldestBuilder: () => sb.from('reports').select('created_at').in('status', ['pending', 'reviewing']).order('created_at', { ascending: true }).limit(1),
  },
  {
    key: 'postReports', label: 'Post reports', type: 'report',
    countBuilder: () => sb.from('post_reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
    oldestBuilder: () => sb.from('post_reports').select('created_at').in('status', ['pending', 'reviewing']).order('created_at', { ascending: true }).limit(1),
  },
  {
    key: 'appeals', label: 'Suspension appeals', type: 'appeal',
    countBuilder: () => sb.from('suspension_appeals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    oldestBuilder: () => sb.from('suspension_appeals').select('created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(1),
  },
  {
    key: 'businessVerifications', label: 'Business verifications', type: 'verification',
    countBuilder: () => sb.from('business_verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    oldestBuilder: () => sb.from('business_verification_requests').select('created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(1),
  },
  {
    key: 'golferVerifications', label: 'Golfer verifications', type: 'verification',
    countBuilder: () => sb.from('golfer_verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    oldestBuilder: () => sb.from('golfer_verification_requests').select('created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(1),
  },
  {
    key: 'courseClaims', label: 'Course claims', type: 'verification',
    countBuilder: () => sb.from('course_claim_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    oldestBuilder: () => sb.from('course_claim_requests').select('created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(1),
  },
  {
    key: 'courseRequests', label: 'Course requests', type: 'courseRequest',
    countBuilder: () => sb.from('course_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    oldestBuilder: () => sb.from('course_requests').select('created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(1),
  },
  {
    key: 'matchRequests', label: 'Course matching', type: 'match',
    countBuilder: () => sb.from('whs_course_match_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    oldestBuilder: () => sb.from('whs_course_match_requests').select('created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(1),
  },
  {
    key: 'unmatchedCourses', label: 'Unmatched courses', type: 'unmatchedCourse',
    countBuilder: () => sb.from('whs_unmatched_courses').select('whs_course_id', { count: 'exact', head: true }).eq('status', 'open'),
    oldestBuilder: () => sb.from('whs_unmatched_courses').select('first_seen_at').eq('status', 'open').order('first_seen_at', { ascending: true }).limit(1),
  },
  {
    key: 'holePhotos', label: 'Hole photos', type: 'holePhoto',
    countBuilder: () => sb.from('course_hole_media').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    oldestBuilder: () => sb.from('course_hole_media').select('created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(1),
  },
  {
    key: 'supportAwaitingReply', label: 'Support tickets', type: 'support',
    countBuilder: () => sb.from('support_tickets').select('id', { count: 'exact', head: true }).eq('last_sender', 'user').not('status', 'in', '(resolved,closed)'),
    oldestBuilder: () => sb.from('support_tickets').select('created_at').eq('last_sender', 'user').not('status', 'in', '(resolved,closed)').order('created_at', { ascending: true }).limit(1),
  },
  {
    key: 'approvals', label: 'Approvals', type: 'approval',
    countBuilder: () => sb.from('admin_action_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    oldestBuilder: () => sb.from('admin_action_requests').select('created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(1),
  },
];

async function fetchTriageCounts(): Promise<TriageCounts> {
  const promises: Promise<any>[] = [];
  for (const q of QUEUES) {
    promises.push(q.countBuilder());
    promises.push(q.oldestBuilder());
  }
  const settled = await Promise.allSettled(promises);

  let hadErrors = false;
  const byQueue: TriageQueueBucket[] = [];

  QUEUES.forEach((q, i) => {
    const countRes = settled[i * 2];
    const oldestRes = settled[i * 2 + 1];
    let count = 0;
    let oldestCreatedAt: string | null = null;

    if (countRes.status === 'fulfilled' && !(countRes.value as any)?.error) {
      count = (countRes.value as any).count ?? 0;
    } else {
      hadErrors = true;
    }
    if (oldestRes.status === 'fulfilled' && !(oldestRes.value as any)?.error) {
      const row = ((oldestRes.value as any).data ?? [])[0];
      oldestCreatedAt = row?.created_at ?? row?.first_seen_at ?? null;
    } else {
      hadErrors = true;
    }

    byQueue.push({ key: q.key, label: q.label, type: q.type, count, route: inboxRoute(q.type), oldestCreatedAt });
  });

  const get = (k: string) => byQueue.find(b => b.key === k)?.count ?? 0;
  const reports = get('reports');
  const postReports = get('postReports');
  const total = byQueue.reduce((n, b) => n + b.count, 0);

  let oldestCreatedAt: string | null = null;
  let oldestQueueRoute = '/admin-v2/inbox';
  let oldestType: InboxTypeSlug | null = null;
  for (const b of byQueue) {
    if (!b.count || !b.oldestCreatedAt) continue;
    if (!oldestCreatedAt || b.oldestCreatedAt < oldestCreatedAt) {
      oldestCreatedAt = b.oldestCreatedAt;
      oldestQueueRoute = b.route;
      oldestType = b.type;
    }
  }

  return {
    moderationReports: reports + postReports,
    reports,
    postReports,
    suspensionAppeals: get('appeals'),
    businessVerifications: get('businessVerifications'),
    golferVerifications: get('golferVerifications'),
    courseClaims: get('courseClaims'),
    courseRequests: get('courseRequests'),
    matchRequests: get('matchRequests'),
    unmatchedCourses: get('unmatchedCourses'),
    holePhotos: get('holePhotos'),
    supportAwaitingReply: get('supportAwaitingReply'),
    approvals: get('approvals'),
    total,
    byQueue,
    oldestCreatedAt,
    oldestQueueRoute,
    oldestType,
    hadErrors,
  };
}

export function useTriageCounts() {
  return useQuery({
    queryKey: ['admin-v2', 'dashboard', 'triage-counts'],
    queryFn: fetchTriageCounts,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

