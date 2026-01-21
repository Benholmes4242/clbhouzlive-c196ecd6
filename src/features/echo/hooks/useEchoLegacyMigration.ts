import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getLegacyConversations,
  isLegacyMigrated,
  markLegacyMigrated,
  type ChatConversationRow,
} from '@/features/echo/utils/echoLegacy';
import { analyticsEvents } from '@/utils/analyticsEvents';

type Options = {
  batchSize?: number;     // default 25
  requireConsent?: boolean; // default true
};

export function useEchoLegacyMigration(opts?: Options) {
  const { batchSize = 25, requireConsent = true } = opts ?? {};
  const [needsConsent, setNeedsConsent] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [hasLegacy, setHasLegacy] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const already = isLegacyMigrated();
      const legacy = getLegacyConversations();
      setHasLegacy(legacy.length > 0);

      if (!legacy.length || already) return;

      if (requireConsent) {
        setNeedsConsent(true);
        return; // wait for user to accept explicitly
      }

      await runMigration(legacy);
    })();
  }, []);

  const runMigration = async (legacy: ChatConversationRow[]) => {
    try {
      setIsMigrating(true);
      analyticsEvents.track('echo_legacy_migration_start', { count: legacy.length });

      // Batch upsert conversations (shell rows)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let idx = 0;
      while (idx < legacy.length) {
        const slice = legacy.slice(idx, idx + batchSize);
        idx += batchSize;

        const upserts = slice.map(c => ({
          id: c.id,
          user_id: user.id,
          title: c.title ?? 'Untitled conversation',
          conversation_type: 'chat',
          created_at: c.createdAt,
          updated_at: c.lastActivityAt ?? c.createdAt,
          messages: c.messages,
        }));

        const { error: convErr } = await supabase
          .from('conversations')
          .upsert(upserts, { onConflict: 'id' });

        if (convErr) throw convErr;
      }

      markLegacyMigrated();
      analyticsEvents.track('echo_legacy_migration_success');
      setNeedsConsent(false);
    } catch (e) {
      console.error('Legacy migration failed', e);
      analyticsEvents.track('echo_legacy_migration_error', { error: String(e) });
      // Don't mark as migrated; user can retry on next open
    } finally {
      setIsMigrating(false);
    }
  };

  const acceptAndMigrate = async () => {
    const legacy = getLegacyConversations();
    if (!legacy.length) {
      setNeedsConsent(false);
      return;
    }
    await runMigration(legacy);
  };

  const dismissMigration = () => {
    // User can choose to keep legacy local; we do NOT mark migrated
    setNeedsConsent(false);
    analyticsEvents.track('echo_legacy_migration_dismissed');
  };

  return {
    hasLegacy,
    needsConsent,
    isMigrating,
    acceptAndMigrate,
    dismissMigration,
  };
}

