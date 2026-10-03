import { supabase } from '@/integrations/supabase/client';

const FALLBACK_STORAGE_KEY = 'sb-ybxkehyomcakqjvuhnna-auth-token';

/**
 * Synchronous "this phone was signed in" check. Reads the supabase-js auth
 * storage entry and reports whether it parses with a non-empty
 * refresh_token. It says NOTHING about validity — the token may be expired
 * and the refresh may fail; useSupabaseSession remains the authority.
 */
export function hasStoredSession(): boolean {
  try {
    const key =
      ((supabase.auth as any).storageKey as string | undefined) || FALLBACK_STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const refresh = parsed?.refresh_token ?? parsed?.currentSession?.refresh_token;
    return typeof refresh === 'string' && refresh.length > 0;
  } catch {
    return false;
  }
}
