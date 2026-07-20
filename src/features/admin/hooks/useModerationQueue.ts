import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ReportKind = 'user' | 'post';
export type ReportStatus = 'pending' | 'reviewing' | 'actioned' | 'dismissed';

export interface RawUserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reported_conversation_id: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_note?: string | null;
  is_high_priority?: boolean | null;
}

export interface RawPostReport {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_note?: string | null;
}

export interface ProfileLite {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
}

export interface PostLite {
  id: string;
  user_id: string;
  content: string | null;
  created_at: string;
  auto_hidden?: boolean | null;
  moderation_hidden?: boolean | null;
  author?: ProfileLite | null;
}

export interface ReportItem {
  kind: ReportKind;
  raw: RawUserReport | RawPostReport;
  reporter?: ProfileLite | null;
}

export interface ModerationQueueRow {
  key: string; // `user:<uid>` or `post:<pid>`
  kind: ReportKind;
  targetUser?: ProfileLite | null;
  targetPost?: PostLite | null;
  reports: ReportItem[];
  report_count: number;
  reasons: string[];
  status: ReportStatus; // effective status (most-open wins)
  created_at: string; // newest report timestamp
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  is_high_priority: boolean;
  auto_hidden: boolean;
}

export interface QueueFilters {
  status: 'all' | 'pending' | 'reviewing' | 'resolved';
  type: 'all' | 'user' | 'post';
}

const STATUS_RANK: Record<ReportStatus, number> = {
  pending: 0,
  reviewing: 1,
  actioned: 2,
  dismissed: 3,
};

async function fetchProfiles(ids: string[]): Promise<Record<string, ProfileLite>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return {};
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url')
    .in('id', unique);
  if (error) throw error;
  const map: Record<string, ProfileLite> = {};
  for (const p of data ?? []) map[p.id] = p as ProfileLite;
  return map;
}

export async function fetchModerationQueue(): Promise<ModerationQueueRow[]> {
  const [{ data: userReports, error: uErr }, { data: postReports, error: pErr }] = await Promise.all([
    supabase
      .from('reports')
      .select('id, reporter_id, reported_user_id, reported_conversation_id, reason, details, status, created_at, reviewed_by, reviewed_at, resolution_note, is_high_priority')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('post_reports')
      .select('id, post_id, reporter_id, reason, status, created_at, reviewed_by, reviewed_at, resolution_note')
      .order('created_at', { ascending: false })
      .limit(500),
  ]);
  if (uErr) throw uErr;
  if (pErr) throw pErr;

  const uRows = (userReports ?? []) as RawUserReport[];
  const pRows = (postReports ?? []) as RawPostReport[];

  const postIds = pRows.map((r) => r.post_id);
  let posts: Record<string, PostLite> = {};
  if (postIds.length) {
    const { data: postData, error: postErr } = await supabase
      .from('posts')
      .select('id, user_id, content, created_at, auto_hidden, moderation_hidden')
      .in('id', Array.from(new Set(postIds)));
    if (postErr) throw postErr;
    for (const p of postData ?? []) posts[p.id] = p as PostLite;
  }

  const profileIds: string[] = [
    ...uRows.map((r) => r.reporter_id),
    ...uRows.map((r) => r.reported_user_id),
    ...pRows.map((r) => r.reporter_id),
    ...Object.values(posts).map((p) => p.user_id),
  ];
  const profiles = await fetchProfiles(profileIds);
  for (const p of Object.values(posts)) p.author = profiles[p.user_id] ?? null;

  const groups = new Map<string, ModerationQueueRow>();

  const addToGroup = (
    key: string,
    base: Partial<ModerationQueueRow>,
    item: ReportItem,
    status: ReportStatus,
    createdAt: string,
    highPriority: boolean,
  ) => {
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        key,
        kind: base.kind!,
        targetUser: base.targetUser ?? null,
        targetPost: base.targetPost ?? null,
        reports: [item],
        report_count: 1,
        reasons: [item.raw.reason],
        status,
        created_at: createdAt,
        reviewed_by: (item.raw as any).reviewed_by ?? null,
        reviewed_at: (item.raw as any).reviewed_at ?? null,
        is_high_priority: highPriority,
        auto_hidden: base.kind === 'post' ? !!base.targetPost?.auto_hidden : false,
      });
    } else {
      existing.reports.push(item);
      existing.report_count += 1;
      if (!existing.reasons.includes(item.raw.reason)) existing.reasons.push(item.raw.reason);
      if (STATUS_RANK[status] < STATUS_RANK[existing.status]) existing.status = status;
      if (createdAt > existing.created_at) existing.created_at = createdAt;
      if (highPriority) existing.is_high_priority = true;
    }
  };

  for (const r of uRows) {
    addToGroup(
      `user:${r.reported_user_id}`,
      { kind: 'user', targetUser: profiles[r.reported_user_id] ?? { id: r.reported_user_id, display_name: null, username: null, profile_photo_url: null } },
      { kind: 'user', raw: r, reporter: profiles[r.reporter_id] ?? null },
      r.status,
      r.created_at,
      !!r.is_high_priority,
    );
  }
  for (const r of pRows) {
    const post = posts[r.post_id] ?? null;
    addToGroup(
      `post:${r.post_id}`,
      { kind: 'post', targetPost: post },
      { kind: 'post', raw: r, reporter: profiles[r.reporter_id] ?? null },
      r.status,
      r.created_at,
      false,
    );
  }

  const rows = Array.from(groups.values());
  rows.sort((a, b) => {
    const sr = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (sr !== 0) return sr;
    // High priority floats to top within the same status bucket.
    if (a.is_high_priority !== b.is_high_priority) return a.is_high_priority ? -1 : 1;
    if (b.report_count !== a.report_count) return b.report_count - a.report_count;
    return b.created_at.localeCompare(a.created_at);
  });
  return rows;
}

export function useModerationQueue(filters: QueueFilters = { status: 'all', type: 'all' }) {
  const query = useQuery({
    queryKey: ['admin-v2', 'moderation', 'queue'],
    queryFn: fetchModerationQueue,
    staleTime: 15_000,
  });

  const rows = useMemo(() => {
    const all = query.data ?? [];
    return all.filter((row) => {
      if (filters.type !== 'all' && row.kind !== filters.type) return false;
      if (filters.status === 'all') return true;
      if (filters.status === 'resolved') return row.status === 'actioned' || row.status === 'dismissed';
      return row.status === filters.status;
    });
  }, [query.data, filters.status, filters.type]);

  const counts = useMemo(() => {
    const all = query.data ?? [];
    return {
      total: all.length,
      pending: all.filter((r) => r.status === 'pending').length,
      reviewing: all.filter((r) => r.status === 'reviewing').length,
      resolved: all.filter((r) => r.status === 'actioned' || r.status === 'dismissed').length,
      highPriority: all.filter((r) => r.is_high_priority && (r.status === 'pending' || r.status === 'reviewing')).length,
      autoHidden: all.filter((r) => r.auto_hidden && (r.status === 'pending' || r.status === 'reviewing')).length,
      actionedThisWeek: all.filter((r) => {
        if (r.status !== 'actioned') return false;
        if (!r.reviewed_at) return false;
        const t = new Date(r.reviewed_at).getTime();
        return Date.now() - t < 7 * 24 * 3600_000;
      }).length,
      reportsToday: (query.data ?? []).reduce((n, row) => {
        return n + row.reports.filter((r) => {
          const t = new Date(r.raw.created_at).getTime();
          return Date.now() - t < 24 * 3600_000;
        }).length;
      }, 0),
    };
  }, [query.data]);

  return {
    rows,
    counts,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export const QUEUE_QUERY_KEY = ['admin-v2', 'moderation', 'queue'];
