import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import DeletedAccountScreen from './DeletedAccountScreen';

const FLAG = 'clbhouz_account_deleted';

/**
 * SINGLE session-level guard for deleted accounts (BRIEF_DELETE_ACCOUNT_V5,
 * Section C). Mounted once at the top of the authenticated tree so every
 * surface is covered — not per page.
 *
 * Keys on user_profiles.deleted_at ONLY. Never infers deletion from
 * display_name, the `deleted_` username prefix, or is_public — the prefix is
 * anonymisation and is_public is an ordinary privacy setting.
 *
 * Fails OPEN: any network / RLS error leaves the member signed in.
 * The sessionStorage flag keeps the terminal screen up across the sign-out
 * (which nulls `user`) and across a WebView resume in the same session.
 */
const DeletedAccountGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSupabaseSession();
  const [deleted, setDeleted] = React.useState<boolean>(() => {
    try { return sessionStorage.getItem(FLAG) === '1'; } catch { return false; }
  });

  const check = React.useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('deleted_at')
        .eq('id', userId)
        .maybeSingle();
      if (error || !data) return; // fail open
      if (data.deleted_at != null) {
        try { sessionStorage.setItem(FLAG, '1'); } catch { /* ignore */ }
        setDeleted(true);
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
      }
    } catch { /* fail open */ }
  }, []);

  // Cold start + any new session resolution.
  React.useEffect(() => {
    if (!user?.id || deleted) return;
    void check(user.id);
  }, [user?.id, deleted, check]);

  // Backgrounded WebView resume.
  React.useEffect(() => {
    if (!user?.id) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (user?.id) void check(user.id);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.id, check]);

  if (deleted) return <DeletedAccountScreen />;
  return <>{children}</>;
};

export default DeletedAccountGate;
