import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditEntry {
  id: string;
  action: string;
  adminUserId: string;
  targetEmail: string | null;
  createdAt: string;
  details: Record<string, unknown> | null;
}

interface Params {
  page: number;
  pageSize?: number;
  action?: string | null;
}

async function fetchAudit({ page, pageSize = 25, action }: Params): Promise<{
  rows: AuditEntry[];
  hasMore: boolean;
  actions: string[];
}> {
  const from = page * pageSize;
  const to = from + pageSize; // fetch one extra to detect more

  let q = supabase
    .from('admin_audit_log')
    .select('id, action, admin_user_id, target_email, created_at, details')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (action) q = q.eq('action', action);

  const { data, error } = await q;
  if (error) throw error;

  const arr = data ?? [];
  const hasMore = arr.length > pageSize;
  const rows = (hasMore ? arr.slice(0, pageSize) : arr).map((e) => ({
    id: e.id,
    action: e.action,
    adminUserId: e.admin_user_id,
    targetEmail: e.target_email,
    createdAt: e.created_at,
    details: e.details as Record<string, unknown> | null,
  }));

  // Distinct action types for filter (cheap small fetch)
  const { data: actData } = await supabase
    .from('admin_audit_log')
    .select('action')
    .order('created_at', { ascending: false })
    .limit(500);
  const actions = Array.from(new Set((actData ?? []).map((r: any) => r.action))).sort();

  return { rows, hasMore, actions };
}

export function useAudit(params: Params) {
  return useQuery({
    queryKey: ['admin-v2', 'system', 'audit', params],
    queryFn: () => fetchAudit(params),
    staleTime: 30_000,
  });
}
