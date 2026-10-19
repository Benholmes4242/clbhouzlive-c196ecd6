/**
 * BRIEF_ADMIN_SETTINGS S.1 — the Settings page's server state.
 * get_admin_settings is full-admin only (42501 otherwise), so the query is
 * enabled only when panelCan(role).manageAdmins. Both writers invalidate this
 * key; setConfig also drops the member-facing maintenance poll so a flip
 * releases open sessions at once.
 */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { panelCan } from '@/lib/panelCan';
import type { PanelRole } from '@/hooks/usePanelRole';
import { MEMBERS_KEY } from './useMembersRadar';

export const ADMIN_SETTINGS_KEY = ['admin-v2', 'settings'] as const;

export interface AdminSettings {
  maintenance: {
    on: boolean;
    message: string | null;
    changed_at: string | null;
    changed_by: { user_id: string; name: string } | null;
  };
  links: { app_store_url: string | null; play_store_url: string | null };
  staff: { user_id: string; email: string; name: string | null; is_you: boolean }[];
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn as never, (args ?? {}) as never);
  if (error) throw error;
  return data as unknown as T;
}

export function useAdminSettings(role: PanelRole) {
  const qc = useQueryClient();
  const enabled = panelCan(role).manageAdmins;
  useEffect(() => {
    if (!enabled) return;
    const handler = () => qc.invalidateQueries({ queryKey: ADMIN_SETTINGS_KEY });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc, enabled]);

  const query = useQuery({
    queryKey: ADMIN_SETTINGS_KEY,
    queryFn: () => rpc<AdminSettings>('get_admin_settings'),
    enabled,
    staleTime: 30_000,
  });

  /** Returns true on success; the server's own message is toasted on error. */
  const setConfig = async (key: string, value: string): Promise<boolean> => {
    try {
      await rpc('admin_set_app_config', { p_key: key, p_value: value });
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? 'Could not save');
      return false;
    }
    await qc.invalidateQueries({ queryKey: ADMIN_SETTINGS_KEY });
    await qc.invalidateQueries({ queryKey: ['app-config', 'maintenance'] });
    return true;
  };

  const setStaff = async (userId: string, staff: boolean): Promise<boolean> => {
    try {
      await rpc('admin_set_staff_account', { p_user_id: userId, p_staff: staff });
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? 'Could not save');
      return false;
    }
    await qc.invalidateQueries({ queryKey: ADMIN_SETTINGS_KEY });
    await qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    return true;
  };

  return { ...query, setConfig, setStaff };
}
