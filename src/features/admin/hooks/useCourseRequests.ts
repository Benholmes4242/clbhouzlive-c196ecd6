import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

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
  /**
   * BRIEF_HOME_CLUB_PICKER §3.3 — set when the request is a HOME CLUB request
   * for that member, so resolving it can connect them (§3.4).
   */
  homeClubForUserId?: string | null;
  /** BRIEF_CLUB_REQUEST_ANOTHER_COURSE §5 — set on a club course request. */
  forBusinessId?: string | null;
  forClubId?: string | null;
  /** BRIEF_CLUB_COURSE_PICKER §8 — the catalogue row the club picked (attach). */
  forCourseId?: string | null;
  pickedCourseName?: string | null;
  businessName?: string | null;
  clubName?: string | null;
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

export async function fetchCourseRequests(): Promise<CourseRequestRow[]> {
  const { data, error } = await supabase
    .from('course_requests')
    .select('id, requested_by, course_name, location, country, note, status, admin_notes, resolved_by, resolved_at, created_at, home_club_for_user_id, for_business_id, for_club_id, for_course_id')
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
    homeClubForUserId: r.home_club_for_user_id ?? null,
    forBusinessId: r.for_business_id ?? null,
    forClubId: r.for_club_id ?? null,
    forCourseId: r.for_course_id ?? null,
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

  const bizIds = [...new Set(rows.map(r => r.forBusinessId).filter(Boolean))] as string[];
  const clubIds = [...new Set(rows.map(r => r.forClubId).filter(Boolean))] as string[];
  const courseIds = [...new Set(rows.map(r => r.forCourseId).filter(Boolean))] as string[];
  const [bizRes, clubRes, courseRes] = await Promise.all([
    bizIds.length ? supabase.from('business_accounts').select('id, name').in('id', bizIds) : Promise.resolve({ data: [] as any[] }),
    clubIds.length ? supabase.from('golf_clubs').select('id, name').in('id', clubIds) : Promise.resolve({ data: [] as any[] }),
    courseIds.length ? supabase.from('golf_courses').select('id, name, club_id').in('id', courseIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const courseMap = new Map(((courseRes as any).data ?? []).map((c: any) => [c.id, c.name as string]));
  const bizMap = new Map(((bizRes as any).data ?? []).map((b: any) => [b.id, b.name as string]));
  const clubMap = new Map(((clubRes as any).data ?? []).map((c: any) => [c.id, c.name as string]));
  for (const r of rows) {
    if (r.forBusinessId) r.businessName = (bizMap.get(r.forBusinessId) as string | undefined) ?? null;
    if (r.forCourseId) r.pickedCourseName = (courseMap.get(r.forCourseId) as string | undefined) ?? null;
    if (r.forClubId) r.clubName = (clubMap.get(r.forClubId) as string | undefined) ?? null;
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

  /**
   * §3.4/§4.3 — resolving a home-club request connects EVERY member who asked
   * for the same club, in one server-side transaction. The member never
   * returns.
   */
  const resolveHomeClubRequest = useMutation({
    mutationFn: async ({ id, clubId, adminNotes }: { id: string; clubId: string; adminNotes?: string | null }) => {
      const { data: result, error } = await supabase.rpc('resolve_home_club_request', {
        p_request_id: id,
        p_club_id: clubId,
        p_admin_notes: adminNotes ?? null,
      });
      if (error) throw error;
      return result as {
        club_name: string;
        requests_resolved: number;
        members_connected: number;
        members: Array<{ user_id: string; username: string | null; display_name: string | null }>;
      };
    },
    onSuccess: (result) => {
      const n = result?.members_connected ?? 0;
      toast.success(
        n > 1
          ? `${result.club_name} set as home club for ${n} members`
          : `${result.club_name} set as home club`,
      );
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Failed to resolve home-club request');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'course-requests'] });
      qc.invalidateQueries({ queryKey: ['admin-v2', 'inbox', 'course-requests'] });
    },
  });

  /** §3.7 — rejecting clears the pending placeholder; no dead-end state. */
  const rejectHomeClubRequest = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string | null }) => {
      const { error } = await supabase.rpc('reject_home_club_request', {
        p_request_id: id,
        p_admin_notes: adminNotes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success('Request rejected — pending club cleared'),
    onError: (e: any) => toast.error(e?.message || 'Failed to reject request'),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'course-requests'] });
      qc.invalidateQueries({ queryKey: ['admin-v2', 'inbox', 'course-requests'] });
    },
  });

  /** §5 — attaches an existing catalogue course to the requesting club. */
  const resolveClubCourseRequest = useMutation({
    mutationFn: async ({ id, courseId, adminNotes }: { id: string; courseId: string; adminNotes?: string | null }) => {
      const { data: result, error } = await supabase.rpc('resolve_club_course_request', {
        p_request_id: id,
        p_course_id: courseId,
        p_admin_notes: adminNotes ?? null,
      });
      if (error) throw error;
      return result as unknown as { course_name: string; club_name: string };
    },
    onSuccess: (result) => toast.success(`${result?.course_name} attached to ${result?.club_name}`),
    onError: (e: any) => toast.error(e?.message || 'Failed to attach course'),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'course-requests'] });
      qc.invalidateQueries({ queryKey: ['admin-v2', 'inbox', 'course-requests'] });
      qc.invalidateQueries({ queryKey: ['club-course-analytics'] });
      qc.invalidateQueries({ queryKey: ['my-businesses'] });
    },
  });

  const pendingCount = data.filter(r => r.status === 'pending').length;

  return {
    data, isLoading, refetch, pendingCount,
    resolveCourseRequest, resolveHomeClubRequest, rejectHomeClubRequest, resolveClubCourseRequest,
  };
}
