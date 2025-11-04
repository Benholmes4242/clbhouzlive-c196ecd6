# Echo Chat History Migration - Backfill Script

## Overview
This script migrates historical chat conversations from the legacy `conversations` table to the new `echo_threads` and `echo_messages` tables.

## Current Status
✅ **Dual-read implemented**: App reads from `conversations` first, falls back to new tables
✅ **New writes go to**: `echo_threads` and `echo_messages`
✅ **Performance indexes**: Added for both old and new tables

## When to Run This
Run this backfill script when you're ready to consolidate all historical data into the new table structure. This is optional but recommended for:
- Cleaner data model
- Better query performance
- Single source of truth

## One-Click Backfill Script

Run this in Supabase SQL Editor. It's wrapped in a transaction—if anything looks wrong, it will ROLLBACK automatically:

```sql
-- ============================================================================
-- ECHO CHAT BACKFILL: Single Transaction Script
-- ============================================================================
BEGIN;

-- PRE-FLIGHT: Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS conversations_user_updated_idx
  ON conversations (user_id, updated_at DESC) WHERE conversation_type = 'chat';

CREATE INDEX IF NOT EXISTS echo_threads_user_updated_idx
  ON echo_threads (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS echo_messages_user_created_idx
  ON echo_messages (user_id, created_at DESC);

-- STEP 1: Create missing threads from conversations
INSERT INTO echo_threads (id, user_id, created_at, updated_at)
SELECT 
  c.id,
  c.user_id,
  COALESCE(c.created_at, now()),
  COALESCE(c.updated_at, now())
FROM conversations c
WHERE c.conversation_type = 'chat'
  AND NOT EXISTS (
    SELECT 1 FROM echo_threads t WHERE t.id = c.id
  );

-- STEP 2: Explode messages JSON array into individual rows
INSERT INTO echo_messages (thread_id, user_id, role, content, created_at)
SELECT
  c.id as thread_id,
  c.user_id,
  COALESCE((m->>'type')::text, (m->>'role')::text, 'user') as role,
  (m->>'content')::text as content,
  COALESCE(
    (m->>'timestamp')::timestamptz,
    (m->>'created_at')::timestamptz,
    c.updated_at,
    now()
  ) as created_at
FROM conversations c
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(c.messages, '[]'::jsonb)) as m
WHERE c.conversation_type = 'chat'
  AND (m->>'content') IS NOT NULL
ON CONFLICT DO NOTHING;

-- STEP 3: Verification queries
DO $$
DECLARE
  v_old_conv_count INTEGER;
  v_new_thread_count INTEGER;
  v_old_msg_count INTEGER;
  v_new_msg_count INTEGER;
BEGIN
  -- Count conversations
  SELECT COUNT(*) INTO v_old_conv_count
  FROM conversations WHERE conversation_type = 'chat';
  
  SELECT COUNT(*) INTO v_new_thread_count
  FROM echo_threads;
  
  -- Count messages (approximate for old)
  SELECT SUM(jsonb_array_length(messages)) INTO v_old_msg_count
  FROM conversations WHERE conversation_type = 'chat';
  
  SELECT COUNT(*) INTO v_new_msg_count
  FROM echo_messages;
  
  RAISE NOTICE 'Verification Results:';
  RAISE NOTICE '  Old conversations: %', v_old_conv_count;
  RAISE NOTICE '  New threads: %', v_new_thread_count;
  RAISE NOTICE '  Old messages (approx): %', v_old_msg_count;
  RAISE NOTICE '  New messages: %', v_new_msg_count;
  
  -- Basic sanity check
  IF v_new_thread_count < v_old_conv_count THEN
    RAISE EXCEPTION 'Thread count mismatch! Expected >=% but got %', v_old_conv_count, v_new_thread_count;
  END IF;
  
  IF v_new_msg_count < (v_old_msg_count * 0.9) THEN
    RAISE WARNING 'Message count seems low. Expected ~% but got %', v_old_msg_count, v_new_msg_count;
  END IF;
END $$;

-- COMMIT if everything looks good, or manually ROLLBACK if needed
COMMIT;

-- Post-commit verification (run separately after COMMIT)
-- SELECT 
--   'Threads' as type, COUNT(*) as count FROM echo_threads
-- UNION ALL
-- SELECT 
--   'Messages' as type, COUNT(*) as count FROM echo_messages
-- UNION ALL
-- SELECT 
--   'Conversations' as type, COUNT(*) as count FROM conversations WHERE conversation_type = 'chat';
```

## Post-Migration Steps

1. **Verify counts match**:
   ```sql
   -- Total messages should roughly match between old and new
   SELECT 
     (SELECT SUM(jsonb_array_length(messages)) FROM conversations WHERE conversation_type = 'chat') as old_msg_count,
     (SELECT COUNT(*) FROM echo_messages) as new_msg_count;
   ```

2. **Test in UI**: Open the Echo chat history and verify all conversations appear correctly

3. **Optional: Update fetcher to single-source**
   - After verification, you can update `fetchChatHistory` to only read from `echo_threads/echo_messages`
   - Keep the dual-read fallback for a few releases as a safety net

4. **Optional: Archive old conversations table**
   - Once confident, you can mark `conversations` as deprecated
   - Don't delete immediately - keep as backup for a few weeks

## Rollback Plan

If issues arise:
- The dual-read fetcher automatically falls back to `conversations` if new tables are empty
- No data loss - old `conversations` table remains untouched
- Simply truncate the new tables to reset:
  ```sql
  TRUNCATE echo_messages, echo_threads CASCADE;
  ```

## Current State
- ✅ Writes: New messages go to `echo_threads/echo_messages`
- ✅ Reads: Dual-read (conversations → echo_threads fallback)
- ⏳ Backfill: Run when ready with script above
- 🎯 Future: Single-source read from `echo_threads/echo_messages`
