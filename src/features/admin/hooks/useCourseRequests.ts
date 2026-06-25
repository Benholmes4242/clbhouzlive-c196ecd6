import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CourseRequestStatus = 'pending' | 'added' | 'rejected' | 'duplicate';

export interface CourseRequestRow {
  id: string;
  requestedBy: string | null;
  courseName: string;
  location: string | null;
  country: string | null;
  note: string | null;
  status: CourseRequestStatus;
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
}

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  added: 1,
  duplicate: 2,
  rejected: 3,
};

async function fetchCourseRequests(): Promise<CourseRequestRow[]> {
  const { data, error } = await supabase
    .from('course_requests')
    .select('id, requested_by, course_name, location, country, note, status, admin_notes, resolved_by, resolved_at, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows: CourseRequestRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    requestedBy: r.requested_by,
    courseName: r.course_name,
    location: r.location,
    country: r.country,
    note: r.note,
    status: r.status,
    adminNotes: r.admin_notes,
    resolvedBy: r.resolved_by,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
  }));

  const userIds = [...new Set(rows.map(r => r.requestedBy).filter(Boolean))] as string[];
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, username, profile_photo_url')
      .in('id', userIds);
    const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    for (const r of rows) {
      const p = r.requestedBy ? map.get(r.requestedBy) : null;
      r.displayName = p?.display_name ?? null;
      r.username = p?.username ?? null;
      r.avatarUrl = p?.profile_photo_url ?? null;
    }
  }

  return rows.sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 99;
    const sb = STATUS_ORDER[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function useCourseRequests() {
  const qc = useQueryClient();
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'course-requests'],
    queryFn: fetchCourseRequests,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const resolveCourseRequest = useMutation({
    mutationFn: async ({
      id, status, adminNotes,
    }: {
      id: string;
      status: CourseRequestStatus;
      adminNotes?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const resolvedBy = userData.user?.id ?? null;
      const isResolving = status !== 'pending';
      const { error } = await supabase
        .from('course_requests')
        .update({
          status,
          admin_notes: adminNotes ?? null,
          resolved_by: isResolving ? resolvedBy : null,
          resolved_at: isResolving ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request updated');
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Failed to update request');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'course-requests'] });
    },
  });

  const pendingCount = data.filter(r => r.status === 'pending').length;

  return { data, isLoading, refetch, pendingCount, resolveCourseRequest };
}
