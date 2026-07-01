import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { QUEUE_QUERY_KEY, type ReportKind } from './useModerationQueue';

type Table = 'reports' | 'post_reports';

const tableFor = (kind: ReportKind): Table => (kind === 'user' ? 'reports' : 'post_reports');

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
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

  return { setReviewing, setReviewingBulk, dismiss };
}
