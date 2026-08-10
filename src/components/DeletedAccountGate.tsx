import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import DeletedAccountScreen from './DeletedAccountScreen';

const FLAG = 'clbhouz_account_deleted';
// The user id the flag was raised for. Lets a DIFFERENT member signing in on the
// same device clear a flag left behind by the previous occupant.
const FLAG_UID = 'clbhouz_account_deleted_uid';

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
        try {
          sessionStorage.setItem(FLAG, '1');
          sessionStorage.setItem(FLAG_UID, userId);
        } catch { /* ignore */ }
        setDeleted(true);
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
      }
    } catch { /* fail open */ }
  }, []);

  const clearFlag = React.useCallback(() => {
    try {
      sessionStorage.removeItem(FLAG);
      sessionStorage.removeItem(FLAG_UID);
    } catch { /* ignore */ }
    setDeleted(false);
  }, []);

  // Cold start + any new session resolution.
  // A resolved user id that differs from the id the flag was raised for means a
  // DIFFERENT member has signed in: clear the stale flag before checking them.
  // `user == null` is NOT treated as a new sign-in — that is the signed-out
  // state the flag exists to survive.
  React.useEffect(() => {
    if (!user?.id) return;
    let flagged = false;
    let flaggedFor: string | null = null;
    try {
      flagged = sessionStorage.getItem(FLAG) === '1';
      flaggedFor = sessionStorage.getItem(FLAG_UID);
    } catch { /* ignore */ }
    if (flagged && flaggedFor !== user.id) {
      clearFlag();
      void check(user.id);
      return;
    }
    if (deleted) return;
    void check(user.id);
  }, [user?.id, deleted, check, clearFlag]);

  const signInAsDifferentAccount = React.useCallback(() => {
    clearFlag();
    // Hard navigation: the gate sits above the router tree and the session was
    // already signed out, so a clean boot into /auth is the safest reset.
    window.location.assign('/auth');
  }, [clearFlag]);

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

  if (deleted) return <DeletedAccountScreen onSignInDifferent={signInAsDifferentAccount} />;
  return <>{children}</>;
};

export default DeletedAccountGate;
