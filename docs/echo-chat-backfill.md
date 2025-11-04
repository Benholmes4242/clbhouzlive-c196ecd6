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

## Pre-flight Checks

```sql
-- Check how many conversations will be migrated
SELECT COUNT(*) as total_conversations
FROM conversations 
WHERE conversation_type = 'chat';

-- Check current state of new tables
SELECT 
  (SELECT COUNT(*) FROM echo_threads) as thread_count,
  (SELECT COUNT(*) FROM echo_messages) as message_count;
```

## Backfill Script

Run this in Supabase SQL Editor when ready:

```sql
-- ============================================================================
-- STEP 1: Create missing threads from conversations
-- ============================================================================
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

-- ============================================================================
-- STEP 2: Explode messages JSON array into individual rows
-- ============================================================================
-- Note: Adjust the json field paths if your messages structure differs
-- Expected structure: messages = [{role: 'user'|'assistant', content: '...', timestamp: '...'}]

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
  AND (m->>'content') IS NOT NULL -- Skip empty messages
ON CONFLICT DO NOTHING; -- In case of re-runs

-- ============================================================================
-- STEP 3: Verify the migration
-- ============================================================================
SELECT 
  'Threads migrated' as check_type,
  COUNT(*) as count
FROM echo_threads
UNION ALL
SELECT 
  'Messages migrated' as check_type,
  COUNT(*) as count
FROM echo_messages
UNION ALL
SELECT 
  'Original conversations' as check_type,
  COUNT(*) as count
FROM conversations
WHERE conversation_type = 'chat';

-- Check for any threads without messages (might need investigation)
SELECT 
  t.id,
  t.user_id,
  t.created_at,
  (SELECT COUNT(*) FROM echo_messages m WHERE m.thread_id = t.id) as message_count
FROM echo_threads t
WHERE NOT EXISTS (
  SELECT 1 FROM echo_messages m WHERE m.thread_id = t.id
)
LIMIT 10;
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
