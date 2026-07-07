/**
 * Mentions v2 — canonical write path.
 *
 * `syncMentionsForContent` is the ONE function every composer's
 * create + edit path calls after saving a row whose content field
 * may contain `@[Name](u|b:UUID)` markup.
 *
 * It diffs the incoming mention set against whatever's already in
 * the `mentions` table for that (source_type, source_id, mentioner_id)
 * triple and applies the minimum change:
 *   - added   → INSERT (trigger fires exactly one notification)
 *   - removed → DELETE (no notification, silent revoke)
 *   - kept    → untouched (no duplicate notification on edit)
 *
 * Self-mentions (mentioning yourself as a user) are dropped before
 * insert so you never notify yourself.
 *
 * The `mentioner_id` MUST equal `auth.uid()` — the RLS forge test
 * proves the DB rejects mismatches. Callers pass the current user
 * id explicitly to make the auth boundary visible at each call site.
 */

import { supabase } from '@/integrations/supabase/client';
import { extractMentions, diffMentions, type ExtractedMention } from './format';

export type MentionSourceType = 'post' | 'comment' | 'top_ten_comment' | 'review';

export interface SyncResult {
  added: number;
  removed: number;
  kept: number;
}

interface ExistingRow {
  mentioned_type: string;
  mentioned_id: string;
}

/**
 * Sync the `mentions` table to match the mention markup embedded in
 * `content` for a single source row.
 *
 * Idempotent: calling twice with the same content is a no-op on the
 * second call, and no duplicate notifications fire.
 */
export async function syncMentionsForContent(params: {
  sourceType: MentionSourceType;
  sourceId: string;
  content: string;
  mentionerId: string;
}): Promise<SyncResult> {
  const { sourceType, sourceId, content, mentionerId } = params;

  if (!sourceId || !mentionerId) {
    return { added: 0, removed: 0, kept: 0 };
  }

  // 1. Parse mentions out of the canonical markup + drop self-user mentions.
  const parsed = extractMentions(content).filter(
    m => !(m.entityType === 'user' && m.entityId === mentionerId),
  );

  // 2. Read existing rows for this exact (source, mentioner) triple.
  //    RLS restricts SELECT to rows the caller can see; we scope by
  //    mentioner_id defensively so a single edit path never wipes
  //    someone else's mentions of the same source row.
  const { data: existingRaw, error: readErr } = await supabase
    .from('mentions')
    .select('mentioned_type, mentioned_id')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .eq('mentioner_id', mentionerId);

  if (readErr) {
    console.warn('[syncMentions] read failed:', readErr);
    // Don't throw — mention sync is non-blocking for the write path.
    return { added: 0, removed: 0, kept: 0 };
  }

  const existing: ExtractedMention[] = (existingRaw as ExistingRow[] | null ?? []).map(r => ({
    entityType: (r.mentioned_type === 'business' ? 'business' : 'user') as 'user' | 'business',
    entityId: r.mentioned_id,
    display: '', // display isn't stored in the row; not needed for diff
  }));

  // 3. Diff by (entityType, entityId).
  const { added, removed } = diffMentions(existing, parsed);
  const kept = parsed.length - added.length;

  // 4. Remove revoked mentions first (so re-inserting a previously-
  //    removed mention still fires a fresh notification).
  if (removed.length > 0) {
    // Supabase-js doesn't support tuple-IN, so we AND per-row. Small N.
    for (const m of removed) {
      await supabase
        .from('mentions')
        .delete()
        .eq('source_type', sourceType)
        .eq('source_id', sourceId)
        .eq('mentioner_id', mentionerId)
        .eq('mentioned_type', m.entityType)
        .eq('mentioned_id', m.entityId);
    }
  }

  // 5. Insert newly-added mentions. The DB trigger creates one
  //    notification per row inserted.
  if (added.length > 0) {
    const rows = added.map(m => ({
      source_type: sourceType,
      source_id: sourceId,
      mentioner_id: mentionerId,
      mentioned_type: m.entityType,
      mentioned_id: m.entityId,
    }));
    const { error: insertErr } = await supabase.from('mentions').insert(rows);
    if (insertErr) {
      console.warn('[syncMentions] insert failed:', insertErr);
    }
  }

  return { added: added.length, removed: removed.length, kept };
}
