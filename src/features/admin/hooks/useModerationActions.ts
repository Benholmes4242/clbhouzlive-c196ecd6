import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { QUEUE_QUERY_KEY, type ReportKind } from './useModerationQueue';

type Table = 'reports' | 'post_reports';

const tableFor = (kind: ReportKind): Table => (kind === 'user' ? 'reports' : 'post_reports');

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function invokeAdmin(body: Record<string, unknown>): Promise<{ data: any; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke('secure-admin-operations', { body });
  if (error) return { data: null, error };
  if (data && typeof data === 'object' && 'error' in data && (data as any).error) {
    return { data: null, error: new Error(String((data as any).error)) };
  }
  return { data, error: null };
}

async function markReportsActioned(kind: ReportKind, ids: string[], note?: string) {
  if (!ids.length) return;
  const uid = await currentUserId();
  const { error } = await supabase
    .from(tableFor(kind))
    .update({
      status: 'actioned',
      resolution_note: note?.trim() || null,
      reviewed_by: uid,
      reviewed_at: new Date().toISOString(),
    })
    .in('id', ids);
  if (error) throw error;
}

export function useModerationActions() {
  const qc = useQueryClient();

  const setReviewing = useMutation({
    mutationFn: async ({ kind, id }: { kind: ReportKind; id: string }) => {
      const uid = await currentUserId();
      const { error } = await supabase
        .from(tableFor(kind))
        .update({ status: 'reviewing', reviewed_by: uid, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Marked as reviewing');
      qc.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to update report'),
  });

  const setReviewingBulk = useMutation({
    mutationFn: async ({ kind, ids }: { kind: ReportKind; ids: string[] }) => {
      if (!ids.length) return;
      const uid = await currentUserId();
      const { error } = await supabase
        .from(tableFor(kind))
        .update({ status: 'reviewing', reviewed_by: uid, reviewed_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Reports marked as reviewing');
      qc.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to update reports'),
  });

  const dismiss = useMutation({
    mutationFn: async ({ kind, ids, note }: { kind: ReportKind; ids: string[]; note?: string }) => {
      if (!ids.length) return;
      const uid = await currentUserId();
      const { error } = await supabase
        .from(tableFor(kind))
        .update({
          status: 'dismissed',
          resolution_note: note?.trim() || null,
          reviewed_by: uid,
          reviewed_at: new Date().toISOString(),
        })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Reports dismissed');
      qc.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to dismiss reports'),
  });

  // -------------- Enforcement actions --------------

  const warnUser = useMutation({
    mutationFn: async (params: {
      userId: string; message: string;
      relatedKind?: ReportKind; relatedIds?: string[];
    }) => {
      const { error } = await invokeAdmin({
        action: 'warn_user',
        targetUserId: params.userId,
        message: params.message,
      });
      if (error) throw error;
      if (params.relatedKind && params.relatedIds?.length) {
        await markReportsActioned(params.relatedKind, params.relatedIds, `Warning sent: ${params.message}`);
      }
    },
    onSuccess: () => {
      toast.success('Warning sent');
      qc.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to send warning'),
  });

  const suspendUser = useMutation({
    mutationFn: async (params: {
      userId: string;
      durationDays: number | null; // null = permanent
      reason: string;
      relatedKind?: ReportKind; relatedIds?: string[];
    }) => {
      const { error } = await invokeAdmin({
        action: 'suspend_user',
        targetUserId: params.userId,
        durationDays: params.durationDays,
        reason: params.reason,
      });
      if (error) throw error;
      if (params.relatedKind && params.relatedIds?.length) {
        const label = params.durationDays == null ? 'permanent' : `${params.durationDays}d`;
        await markReportsActioned(params.relatedKind, params.relatedIds, `Suspended (${label}): ${params.reason}`);
      }
    },
    onSuccess: () => {
      toast.success('User suspended');
      qc.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to suspend user'),
  });

  const unsuspendUser = useMutation({
    mutationFn: async (params: { userId: string }) => {
      const { error } = await invokeAdmin({
        action: 'unsuspend',
        targetUserId: params.userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Suspension lifted');
      qc.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to lift suspension'),
  });

  const hidePost = useMutation({
    mutationFn: async (params: {
      postId: string; reason: string;
      relatedKind?: ReportKind; relatedIds?: string[];
    }) => {
      const { error } = await invokeAdmin({
        action: 'hide_post',
        postId: params.postId,
        reason: params.reason,
      });
      if (error) throw error;
      if (params.relatedKind && params.relatedIds?.length) {
        await markReportsActioned(params.relatedKind, params.relatedIds, `Post hidden: ${params.reason}`);
      }
    },
    onSuccess: () => {
      toast.success('Post hidden');
      qc.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to hide post'),
  });

  const unhidePost = useMutation({
    mutationFn: async (params: { postId: string }) => {
      const { error } = await invokeAdmin({
        action: 'unhide_post',
        postId: params.postId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post restored');
      qc.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to restore post'),
  });

  // Mark reports as actioned without changing the post's hidden state.
  // Used by the "Keep hidden" action on auto-hidden posts.
  const keepHiddenActioned = useMutation({
    mutationFn: async (params: { kind: ReportKind; ids: string[]; note?: string }) => {
      await markReportsActioned(params.kind, params.ids, params.note ?? 'Auto-hide confirmed by moderator');
    },
    onSuccess: () => {
      toast.success('Reports actioned, post remains hidden');
      qc.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to update reports'),
  });

  return {
    setReviewing,
    setReviewingBulk,
    dismiss,
    warnUser,
    suspendUser,
    unsuspendUser,
    hidePost,
    unhidePost,
    keepHiddenActioned,
  };
}
