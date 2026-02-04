/**
 * @deprecated LEGACY - Echo Legacy Migration Hook
 * 
 * ⚠️ THIS FILE IS DEPRECATED
 * 
 * This hook migrates data TO the legacy echo_threads table, which is no longer
 * the primary storage. New conversations use echo_conversations.
 * 
 * This is only kept for backwards compatibility with the legacy AIChatHistory
 * component. Once that component is retired, this hook can be deleted.
 * 
 * Database tables status:
 *   - echo_threads / echo_messages = DEPRECATED (legacy)
 *   - echo_conversations / echo_conversation_messages = ACTIVE (use this)
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getLegacyConversations,
  isLegacyMigrated,
  markLegacyMigrated,
  type ChatConversationRow,
  type ChatMessageRow,
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Migrate to echo_threads and echo_messages
      for (const conv of legacy) {
        // Get first user question for the thread
        const firstUserMsg = conv.messages?.find(m => m.type === 'user');
        
        // Create thread
        const { data: thread, error: threadErr } = await supabase
          .from('echo_threads')
          .insert({
            id: conv.id,
            user_id: user.id,
            first_user_question: firstUserMsg?.content ?? conv.title ?? 'Untitled',
            created_at: conv.createdAt,
            last_activity_at: conv.lastActivityAt ?? conv.createdAt,
            has_response: conv.messages?.some(m => m.type === 'ai') ?? false,
            message_count: conv.messages?.length ?? 0,
          })
          .select('id')
          .single();

        if (threadErr) {
          // Thread might already exist, skip
          console.warn('Thread creation skipped:', threadErr.message);
          continue;
        }

        // Insert messages for this thread
        const messages = conv.messages || [];
        if (messages.length > 0 && thread) {
          const messageInserts = messages.map((m: ChatMessageRow, idx: number) => ({
            thread_id: thread.id,
            user_id: user.id,
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content || '',
            created_at: m.timestamp || new Date(Date.now() + idx).toISOString(),
          }));

          const { error: msgErr } = await supabase
            .from('echo_messages')
            .insert(messageInserts);

          if (msgErr) {
            console.warn('Message insertion error:', msgErr.message);
          }
        }
      }

      markLegacyMigrated();
      analyticsEvents.track('echo_legacy_migration_success');
      setNeedsConsent(false);
    } catch (e) {
      console.error('Legacy migration failed', e);
      analyticsEvents.track('echo_legacy_migration_error', { error: String(e) });
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
