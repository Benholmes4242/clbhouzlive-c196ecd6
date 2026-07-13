import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';

export type AdminActionType = 'permanent_ban' | 'delete_user' | 'role_change';
export type AdminRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface AdminRequestRow {
  id: string;
  requested_by: string;
  action_type: AdminActionType;
  target_user_id: string | null;
  target_email: string | null;
  payload: Record<string, unknown> | null;
  related_report_id: string | null;
  status: AdminRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  requester?: { display_name: string | null; username: string | null; profile_photo_url: string | null } | null;
  target?: { display_name: string | null; username: string | null; profile_photo_url: string | null } | null;
}

export const APPROVAL_QUERY_KEY = ['admin-v2', 'approval-requests'] as const;

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function fetchRequests(status: AdminRequestStatus | 'all'): Promise<AdminRequestRow[]> {
  let q = supabase
    .from('admin_action_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as unknown as AdminRequestRow[];
  if (!rows.length) return rows;

  const ids = new Set<string>();
  rows.forEach(r => {
    if (r.requested_by) ids.add(r.requested_by);
    if (r.target_user_id) ids.add(r.target_user_id);
  });
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url')
    .in('id', Array.from(ids));
  const map = new Map((profiles ?? []).map(p => [p.id, p]));

  return rows.map(r => ({
    ...r,
    requester: map.get(r.requested_by) ?? null,
    target: r.target_user_id ? (map.get(r.target_user_id) ?? null) : null,
  }));
}

/** Full-admin: list requests by status. */
export function useAdminActionRequests(status: AdminRequestStatus | 'all' = 'pending') {
  const query = useQuery({
    queryKey: [...APPROVAL_QUERY_KEY, status],
    queryFn: () => fetchRequests(status),
    staleTime: 30_000,
  });
  return query;
}

interface CreateRequestInput {
  action_type: AdminActionType;
  target_user_id: string | null;
  target_email?: string | null;
  payload?: Record<string, unknown>;
  related_report_id?: string | null;
}

/** Limited-admin: create a request. */
export function useCreateAdminActionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRequestInput) => {
      const uid = await currentUserId();
      if (!uid) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('admin_action_requests')
        .insert({
          requested_by: uid,
          action_type: input.action_type,
          target_user_id: input.target_user_id,
          target_email: input.target_email ?? null,
          payload: (input.payload ?? {}) as any,
          related_report_id: input.related_report_id ?? null,
          status: 'pending',
        })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Request submitted for full-admin approval');
      qc.invalidateQueries({ queryKey: APPROVAL_QUERY_KEY });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to submit request'),
  });
}

async function notifyUser(userId: string, title: string, message: string) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      recipient_actor_type: 'user',
      recipient_actor_id: userId,
      type: 'moderation',
      title,
      message,
    } as any);
  } catch (e) {
    console.warn('[approval] notify failed', e);
  }
}

async function markReportActioned(reportId: string, note: string) {
  const uid = await currentUserId();
  // try both possible tables
  const patch = {
    status: 'actioned',
    resolution_note: note,
    reviewed_by: uid,
    reviewed_at: new Date().toISOString(),
  };
  const r1 = await supabase.from('reports').update(patch).eq('id', reportId).select('id');
  if (r1.error || !r1.data?.length) {
    await supabase.from('post_reports').update(patch).eq('id', reportId).select('id');
  }
}

/** Full-admin: approve / reject / cancel. */
export function useAdminActionRequestActions() {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: APPROVAL_QUERY_KEY });

  const reject = useMutation({
    mutationFn: async ({ requestId, note }: { requestId: string; note: string }) => {
      const uid = await currentUserId();
      const { data: existing, error: readErr } = await supabase
        .from('admin_action_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();
      if (readErr) throw readErr;
      if (!existing || existing.status !== 'pending') throw new Error('Request is no longer pending');

      const { error } = await supabase
        .from('admin_action_requests')
        .update({
          status: 'rejected',
          reviewed_by: uid,
          reviewed_at: new Date().toISOString(),
          review_note: note?.trim() || null,
        })
        .eq('id', requestId)
        .eq('status', 'pending');
      if (error) throw error;

      await notifyUser(
        existing.requested_by,
        'Admin request declined',
        `Your ${existing.action_type} request was declined${note?.trim() ? `: ${note.trim()}` : '.'}`,
      );
    },
    onSuccess: () => { toast.success('Request rejected'); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to reject'),
  });

  const approve = useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const uid = await currentUserId();

      // Re-read to guard against double-approve
      const { data: req, error: readErr } = await supabase
        .from('admin_action_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();
      if (readErr) throw readErr;
      if (!req) throw new Error('Request not found');
      if (req.status !== 'pending') throw new Error('Request is no longer pending');

      const payload = (req.payload ?? {}) as Record<string, any>;

      // Execute the underlying action using the FULL admin's credentials.
      if (req.action_type === 'permanent_ban') {
        if (!req.target_user_id) throw new Error('Missing target user');
        const { data, error } = await supabase.functions.invoke('secure-admin-operations', {
          body: {
            action: 'suspend_user',
            targetUserId: req.target_user_id,
            durationDays: null,
            reason: payload.reason ?? 'Permanent ban approved',
          },
        });
        if (error) throw error;
        if (data && (data as any).error) throw new Error((data as any).error);
      } else if (req.action_type === 'delete_user') {
        if (!req.target_user_id) throw new Error('Missing target user');
        const { data, error } = await supabase.functions.invoke('secure-admin-operations', {
          body: {
            action: 'delete_user',
            targetUserId: req.target_user_id,
            targetEmail: req.target_email ?? payload.targetEmail ?? undefined,
            reason: payload.reason ?? 'Deletion approved',
          },
        });
        if (error) throw error;
        if (data && (data as any).error) throw new Error((data as any).error);
      } else if (req.action_type === 'role_change') {
        if (!req.target_user_id) throw new Error('Missing target user');
        const roleAction = payload.roleAction as
          | 'grant_full' | 'grant_limited' | 'downgrade' | 'revoke' | undefined;
        if (!roleAction) throw new Error('Missing roleAction in payload');
        const { data, error } = await supabase.functions.invoke('admin-role-manage', {
          body: { action: roleAction, userId: req.target_user_id },
        });
        if (error) throw error;
        if (data && (data as any).error) throw new Error((data as any).error);
      } else {
        throw new Error(`Unknown action_type: ${req.action_type}`);
      }

      // Execution succeeded -> mark request approved.
      const { error: upErr } = await supabase
        .from('admin_action_requests')
        .update({
          status: 'approved',
          reviewed_by: uid,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('status', 'pending');
      if (upErr) throw upErr;

      if (req.related_report_id) {
        await markReportActioned(req.related_report_id, `Approved ${req.action_type}`);
      }

      await notifyUser(
        req.requested_by,
        'Admin request approved',
        `Your ${req.action_type} request was approved and actioned.`,
      );
    },
    onSuccess: () => { toast.success('Request approved and executed'); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to approve'),
  });

  return { approve, reject };
}
