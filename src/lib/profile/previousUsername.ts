/** EP2 — old profile links keep working. resolve_previous_username owns the
 * lookup; any failure or empty answer means the normal not-found state. */
import { supabase } from '@/integrations/supabase/client';

export async function resolvePreviousUsername(old: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('resolve_previous_username', { p_username: old });
    if (error || typeof data !== 'string' || !data || data === old) return null;
    return data;
  } catch { return null; }
}

/** Swap the username segment and keep any sub-path, query and hash. */
export function renamedProfilePath(pathname: string, old: string, current: string, search = '', hash = '') {
  const prefix = `/profile/${old}`;
  const rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
  return `/profile/${current}${rest}${search}${hash}`;
}
