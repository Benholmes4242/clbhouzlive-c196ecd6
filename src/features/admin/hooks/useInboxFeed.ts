import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import { fetchModerationQueue, type ModerationQueueRow } from './useModerationQueue';
import { fetchAppeals, type AppealRow } from './useAppeals';
import { fetchAdminActionRequests, type AdminRequestRow } from './useAdminActionRequests';
import { fetchSupportTickets, type SupportTicketRow } from './useSupportTickets';
import { fetchVerifications, type VerificationRow } from './useVerifications';
import { fetchCourseRequests, type CourseRequestRow } from './useCourseRequests';
import { fetchMatchRequests, type MatchRequestRow } from './useMatchRequests';
import type { InboxTypeSlug } from './useTriageCounts';

export type InboxType = InboxTypeSlug;

export interface InboxItem {
  id: string;
  type: InboxType;
  title: string;
  meta: string;
  createdAt: string;
  isHighPriority: boolean;
  payload: unknown;
  closedOutcome?: string;
}

export interface InboxFeedResult {
  items: InboxItem[];        // open items, oldest first
  doneItems: InboxItem[];    // recent 20 closed
  isLoading: boolean;
  hadErrors: boolean;
  counts: Record<InboxType, number>;
  oldestCreatedAt: string | null;
  refetchAll: () => void;
}

// ---------------- mappers ----------------

const humanAction = (action: string): string => {
  switch (action) {
    case 'permanent_ban': return 'Permanent ban request';
    case 'delete_user': return 'Delete user request';
    case 'role_change': return 'Role change request';
    default: return `${action.replace(/_/g, ' ')} request`;
  }
};

const reportKindTitle = (row: ModerationQueueRow): string => {
  const reason = row.reasons[0] ?? 'reported';
  if (row.kind === 'post') return `Post reported: ${reason}`;
  return `User reported: ${reason}`;
};

const reportMeta = (row: ModerationQueueRow): string => {
  const who = row.kind === 'post'
    ? (row.targetPost?.author?.display_name ?? row.targetPost?.author?.username ?? 'unknown')
    : (row.targetUser?.display_name ?? row.targetUser?.username ?? 'unknown');
  const n = row.report_count;
  return `Report - ${n} report${n === 1 ? '' : 's'} against ${who}`;
};

// ---------------- hook ----------------

export function useInboxFeed(): InboxFeedResult {
  const { role } = usePanelRole();
  const caps = panelCan(role);
  const canMod = caps.viewModeration;
  const canUsers = caps.viewUsers;
  const canApprove = caps.approveRequests;

  const mod = useQuery({
    queryKey: ['admin-v2', 'inbox', 'moderation-open'],
    queryFn: fetchModerationQueue,
    enabled: canMod,
    staleTime: 15_000,
  });
  const modDone = useQuery({
    queryKey: ['admin-v2', 'inbox', 'moderation-done'],
    queryFn: fetchModerationQueue,
    enabled: canMod,
    staleTime: 30_000,
  });
  const appealsOpen = useQuery({
    queryKey: ['admin-v2', 'inbox', 'appeals-open'],
    queryFn: () => fetchAppeals('pending'),
    enabled: canMod,
    staleTime: 30_000,
  });
  const appealsDone = useQuery({
    queryKey: ['admin-v2', 'inbox', 'appeals-done'],
    queryFn: () => fetchAppeals('all'),
    enabled: canMod,
    staleTime: 30_000,
  });
  const supportOpen = useQuery({
    queryKey: ['admin-v2', 'inbox', 'support-open'],
    queryFn: () => fetchSupportTickets(),
    enabled: canMod,
    staleTime: 30_000,
  });
  const supportDone = useQuery({
    queryKey: ['admin-v2', 'inbox', 'support-done'],
    queryFn: () => fetchSupportTickets({ closed: true }),
    enabled: canMod,
    staleTime: 30_000,
  });
  const verifOpen = useQuery({
    queryKey: ['admin-v2', 'inbox', 'verif-open'],
    queryFn: fetchVerifications,
    enabled: canUsers,
    staleTime: 30_000,
  });
  // verifications 'done' shares the same fetch - filter locally
  const matchOpen = useQuery({
    queryKey: ['admin-v2', 'inbox', 'match-open'],
    queryFn: () => fetchMatchRequests('pending'),
    enabled: canUsers,
    staleTime: 30_000,
  });
  const matchDoneMatched = useQuery({
    queryKey: ['admin-v2', 'inbox', 'match-done-matched'],
    queryFn: () => fetchMatchRequests('matched'),
    enabled: canUsers,
    staleTime: 30_000,
  });
  const matchDoneRejected = useQuery({
    queryKey: ['admin-v2', 'inbox', 'match-done-rejected'],
    queryFn: () => fetchMatchRequests('rejected'),
    enabled: canUsers,
    staleTime: 30_000,
  });
  const courseReqAll = useQuery({
    queryKey: ['admin-v2', 'inbox', 'course-requests'],
    queryFn: fetchCourseRequests,
    enabled: canUsers,
    staleTime: 30_000,
  });
  const approvalsOpen = useQuery({
    queryKey: ['admin-v2', 'inbox', 'approvals-open'],
    queryFn: () => fetchAdminActionRequests('pending'),
    enabled: canApprove,
    staleTime: 30_000,
  });
  const approvalsDone = useQuery({
    queryKey: ['admin-v2', 'inbox', 'approvals-done'],
    queryFn: () => fetchAdminActionRequests('all'),
    enabled: canApprove,
    staleTime: 30_000,
  });

  const allQueries = [
    mod, modDone, appealsOpen, appealsDone, supportOpen, supportDone,
    verifOpen, matchOpen, matchDoneMatched, matchDoneRejected,
    courseReqAll, approvalsOpen, approvalsDone,
  ];

  const isLoading = allQueries.some(q => q.isLoading && (q.fetchStatus !== 'idle'));
  const hadErrors = allQueries.some(q => q.isError);

  const { openItems, doneItems, counts, oldest } = useMemo(() => {
    const open: InboxItem[] = [];
    const done: InboxItem[] = [];

    // Reports (open)
    if (canMod && mod.data) {
      for (const row of mod.data) {
        if (row.status === 'pending' || row.status === 'reviewing') {
          open.push({
            id: row.key,
            type: 'report',
            title: reportKindTitle(row),
            meta: reportMeta(row),
            createdAt: row.created_at,
            isHighPriority: !!row.is_high_priority,
            payload: row,
          });
        }
      }
    }
    // Reports (done)
    if (canMod && modDone.data) {
      for (const row of modDone.data) {
        if (row.status === 'actioned' || row.status === 'dismissed') {
          done.push({
            id: `done-${row.key}`,
            type: 'report',
            title: reportKindTitle(row),
            meta: reportMeta(row),
            createdAt: row.reviewed_at ?? row.created_at,
            isHighPriority: false,
            payload: row,
            closedOutcome: row.status === 'actioned' ? 'Actioned' : 'Dismissed - no violation',
          });
        }
      }
    }

    // Appeals (open)
    if (canMod && appealsOpen.data) {
      for (const row of appealsOpen.data) {
        open.push({
          id: row.id,
          type: 'appeal',
          title: 'Suspension appeal',
          meta: `Appeal - ${row.appellant?.display_name ?? row.appellant?.username ?? 'unknown'}`,
          createdAt: row.created_at,
          isHighPriority: false,
          payload: row,
        });
      }
    }
    if (canMod && appealsDone.data) {
      for (const row of appealsDone.data) {
        if (row.status !== 'pending') {
          done.push({
            id: `done-appeal-${row.id}`,
            type: 'appeal',
            title: 'Suspension appeal',
            meta: `Appeal - ${row.appellant?.display_name ?? row.appellant?.username ?? 'unknown'}`,
            createdAt: row.reviewed_at ?? row.created_at,
            isHighPriority: false,
            payload: row,
            closedOutcome: row.status === 'overturned' ? 'Overturned' : 'Upheld',
          });
        }
      }
    }

    // Support (open)
    if (canMod && supportOpen.data) {
      for (const row of supportOpen.data) {
        if (row.status === 'resolved' || row.status === 'closed') continue;
        const who = row.profile?.display_name ?? row.profile?.username ?? 'unknown';
        open.push({
          id: row.id,
          type: 'support',
          title: row.subject,
          meta: `Support - from ${who}`,
          createdAt: row.created_at,
          isHighPriority: false,
          payload: row,
        });
      }
    }
    if (canMod && supportDone.data) {
      for (const row of supportDone.data) {
        const who = row.profile?.display_name ?? row.profile?.username ?? 'unknown';
        done.push({
          id: `done-support-${row.id}`,
          type: 'support',
          title: row.subject,
          meta: `Support - from ${who}`,
          createdAt: row.last_message_at ?? row.created_at,
          isHighPriority: false,
          payload: row,
          closedOutcome: row.status === 'closed' ? 'Closed' : 'Resolved',
        });
      }
    }

    // Verifications (open + done from single query)
    if (canUsers && verifOpen.data) {
      for (const row of verifOpen.data) {
        const isOpen = row.status === 'pending';
        const label =
          row.type === 'course_claim' ? `Course claim: ${row.claimCourseName ?? row.claimBusinessName ?? 'course'}`
          : row.type === 'business' ? 'Business verification'
          : 'Golfer verification';
        const meta =
          row.type === 'course_claim' ? `Verification - ${row.claimBusinessName ?? 'business claim'}`
          : row.type === 'business' ? `Verification - ${row.displayName ?? row.username ?? 'business'}`
          : `Verification - ${row.displayName ?? row.username ?? 'golfer'}`;

        if (isOpen) {
          open.push({
            id: row.id,
            type: 'verification',
            title: label,
            meta,
            createdAt: row.createdAt,
            isHighPriority: false,
            payload: row,
          });
        } else {
          const outcome =
            row.status === 'approved' || row.status === 'accepted' ? 'Approved'
            : row.status === 'rejected' || row.status === 'declined' ? 'Rejected'
            : row.status === 'needs_more_info' ? 'Needs info'
            : row.status;
          done.push({
            id: `done-verif-${row.id}`,
            type: 'verification',
            title: label,
            meta,
            createdAt: row.reviewedAt ?? row.createdAt,
            isHighPriority: false,
            payload: row,
            closedOutcome: outcome,
          });
        }
      }
    }

    // Match requests (open)
    if (canUsers && matchOpen.data) {
      for (const row of matchOpen.data) {
        open.push({
          id: row.id,
          type: 'match',
          title: 'WHS course match request',
          meta: `Matches - ${row.whs_course_name ?? 'unnamed'} <-> ${row.course_name ?? 'course'}`,
          createdAt: row.created_at,
          isHighPriority: false,
          payload: row,
        });
      }
    }
    for (const closed of [matchDoneMatched.data ?? [], matchDoneRejected.data ?? []]) {
      for (const row of closed) {
        done.push({
          id: `done-match-${row.id}`,
          type: 'match',
          title: 'WHS course match request',
          meta: `Matches - ${row.whs_course_name ?? 'unnamed'}`,
          createdAt: row.resolved_at ?? row.created_at,
          isHighPriority: false,
          payload: row,
          closedOutcome: row.status === 'matched' ? 'Matched' : 'Rejected',
        });
      }
    }

    // Course requests
    if (canUsers && courseReqAll.data) {
      for (const row of courseReqAll.data) {
        if (row.status === 'pending') {
          open.push({
            id: row.id,
            type: 'courseRequest',
            title: `New course request: ${row.courseName}`,
            meta: `Course requests - ${row.displayName ?? row.username ?? 'user'}`,
            createdAt: row.createdAt,
            isHighPriority: false,
            payload: row,
          });
        }
      }
    }

    // Approvals
    if (canApprove && approvalsOpen.data) {
      for (const row of approvalsOpen.data) {
        open.push({
          id: row.id,
          type: 'approval',
          title: humanAction(row.action_type),
          meta: `Approvals - by ${row.requester?.display_name ?? row.requester?.username ?? 'admin'}`,
          createdAt: row.created_at,
          isHighPriority: false,
          payload: row,
        });
      }
    }
    if (canApprove && approvalsDone.data) {
      for (const row of approvalsDone.data) {
        if (row.status !== 'pending') {
          done.push({
            id: `done-approval-${row.id}`,
            type: 'approval',
            title: humanAction(row.action_type),
            meta: `Approvals - by ${row.requester?.display_name ?? row.requester?.username ?? 'admin'}`,
            createdAt: row.reviewed_at ?? row.created_at,
            isHighPriority: false,
            payload: row,
            closedOutcome: row.status === 'approved' ? 'Approved' : row.status === 'rejected' ? 'Rejected' : 'Cancelled',
          });
        }
      }
    }

    // Sort open ascending (oldest first) + high priority to top
    open.sort((a, b) => {
      if (a.isHighPriority !== b.isHighPriority) return a.isHighPriority ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt);
    });

    // Sort done descending, cap 20
    done.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const doneCapped = done.slice(0, 20);

    // counts
    const c: Record<InboxType, number> = {
      report: 0, appeal: 0, support: 0, verification: 0, approval: 0, match: 0, courseRequest: 0,
    };
    for (const it of open) c[it.type]++;

    const oldest = open[0]?.createdAt ?? null;

    return { openItems: open, doneItems: doneCapped, counts: c, oldest };
  }, [
    canMod, canUsers, canApprove,
    mod.data, modDone.data, appealsOpen.data, appealsDone.data,
    supportOpen.data, supportDone.data, verifOpen.data,
    matchOpen.data, matchDoneMatched.data, matchDoneRejected.data,
    courseReqAll.data, approvalsOpen.data, approvalsDone.data,
  ]);

  const refetchAll = () => {
    for (const q of allQueries) if (q.refetch) q.refetch();
  };

  return {
    items: openItems,
    doneItems,
    isLoading,
    hadErrors,
    counts,
    oldestCreatedAt: oldest,
    refetchAll,
  };
}
