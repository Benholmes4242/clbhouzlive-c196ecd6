import { supabase } from '@/integrations/supabase/client';

export interface DashboardView {
  id: string;
  name: string;
  params: any;
  is_default: boolean;
  created_at: string;
}

export async function listViews(): Promise<DashboardView[]> {
  const { data, error } = await supabase.rpc('echo_views_list');
  if (error) throw error;
  return data as DashboardView[];
}

export async function saveView(args: {
  name: string;
  params: any;
  setDefault?: boolean;
  viewId?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('echo_views_save', {
    p_name: args.name,
    p_params: args.params,
    p_set_default: !!args.setDefault,
    p_view_id: args.viewId || null,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteView(id: string): Promise<void> {
  const { error } = await supabase.rpc('echo_views_delete', { p_id: id });
  if (error) throw error;
}

export async function getView(id: string): Promise<any> {
  const { data, error } = await supabase.rpc('echo_views_get', { p_id: id });
  if (error) throw error;
  return data;
}
