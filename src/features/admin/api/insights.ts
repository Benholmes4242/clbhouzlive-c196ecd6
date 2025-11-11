import { supabase } from '@/integrations/supabase/client';

export type AdminInsights = {
  conv_total: number;
  conv_24h: number;
  users_active: number;
  shares_active: number;
  export_count: number;
  avg_query_ms: number;
  tags: { name: string; count: number }[];
};

export async function fetchAdminInsights(days = 30): Promise<AdminInsights> {
  const { data, error } = await supabase.rpc('echo_admin_insights_guard', { p_days: days });
  if (error) throw error;
  const row = (data?.[0] ?? {}) as AdminInsights;
  return {
    conv_total: row.conv_total || 0,
    conv_24h: row.conv_24h || 0,
    users_active: row.users_active || 0,
    shares_active: row.shares_active || 0,
    export_count: row.export_count || 0,
    avg_query_ms: row.avg_query_ms || 0,
    tags: row.tags || [],
  };
}
