import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';

export type AppealStatus = 'pending' | 'upheld' | 'overturned';

export interface AppealRow {
  id: string;
  user_id: string;
  suspension_ref: string | null;
  message: string;
  status: AppealStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  appellant?: {
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    is_suspended: boolean | null;
    suspended_until: string | null;
    suspension_reason: string | null;
  } | null;
}

export const APPEALS_QUERY_KEY = ['admin-v2', 'appeals'] as const;

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function fetchAppeals(status: AppealStatus | 'all'): Promise<AppealRow[]> {
  let q = supabase
    .from('suspension_appeals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as unknown as AppealRow[];
  if (!rows.length) return rows;

  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url, is_suspended, suspended_until, suspension_reason')
    .in('id', ids);
  const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  return rows.map((r) => ({
    ...r,
    appellant: (map.get(r.user_id) as any) ?? null,
  }));
}

export function useAppeals(status: AppealStatus | 'all' = 'pending') {
  return useQuery({
    queryKey: [...APPEALS_QUERY_KEY, status],
    queryFn: () => fetchAppeals(status),
    staleTime: 30_000,
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
    console.warn('[appeals] notify failed', e);
  }
}

export function useAppealActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: APPEALS_QUERY_KEY });

  const uphold = useMutation({
    mutationFn: async ({ appealId, note }: { appealId: string; note: string }) => {
      const uid = await currentUserId();
      const { data: existing, error: readErr } = await supabase
        .from('suspension_appeals')
        .select('*')
        .eq('id', appealId)
        .maybeSingle();
      if (readErr) throw readErr;
      if (!existing || existing.status !== 'pending') throw new Error('Appeal is no longer pending');

      const { error } = await supabase
        .from('suspension_appeals')
        .update({
          status: 'upheld',
          reviewed_by: uid,
          reviewed_at: new Date().toISOString(),
          review_note: note?.trim() || null,
        })
        .eq('id', appealId)
        .eq('status', 'pending');
      if (error) throw error;

      await notifyUser(
        existing.user_id,
        'Appeal reviewed',
        `Your appeal was reviewed and the suspension stands${note?.trim() ? `: ${note.trim()}` : '.'}`,
      );
    },
    onSuccess: () => { toast.success('Appeal upheld'); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to uphold appeal'),
  });

  const overturn = useMutation({
    mutationFn: async ({ appealId, note }: { appealId: string; note: string }) => {
      const uid = await currentUserId();
      const { data: existing, error: readErr } = await supabase
        .from('suspension_appeals')
        .select('*')
        .eq('id', appealId)
        .maybeSingle();
      if (readErr) throw readErr;
      if (!existing || existing.status !== 'pending') throw new Error('Appeal is no longer pending');

      // Lift the suspension FIRST. If this fails, do not mark overturned.
      const { data: unsData, error: unsErr } = await supabase.functions.invoke('secure-admin-operations', {
        body: { action: 'unsuspend', targetUserId: existing.user_id },
      });
      if (unsErr) throw unsErr;
      if (unsData && (unsData as any).error) throw new Error((unsData as any).error);

      const { error } = await supabase
        .from('suspension_appeals')
        .update({
          status: 'overturned',
          reviewed_by: uid,
          reviewed_at: new Date().toISOString(),
          review_note: note?.trim() || null,
        })
        .eq('id', appealId)
        .eq('status', 'pending');
      if (error) throw error;

      await notifyUser(
        existing.user_id,
        'Appeal successful',
        `Good news - your appeal was successful and your account has been reinstated${note?.trim() ? `: ${note.trim()}` : '.'}`,
      );
    },
    onSuccess: () => { toast.success('Appeal overturned, suspension lifted'); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to overturn appeal'),
  });

  return { uphold, overturn };
}
