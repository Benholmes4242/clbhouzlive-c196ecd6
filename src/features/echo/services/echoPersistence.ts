/**
 * @deprecated LEGACY - Echo Persistence Service
 * 
 * ⚠️ THIS FILE IS DEPRECATED - DO NOT USE FOR NEW CODE
 * 
 * This service writes to the LEGACY echo_threads/echo_messages tables.
 * New conversations should use:
 *   - Table: echo_conversations + echo_conversation_messages
 *   - Hook: useEchoConversation (src/features/echo/hooks/useEchoConversation.ts)
 *   - Functions: createConversation, insertMessage from useEchoHistory.ts
 * 
 * This file is only kept for the legacy AIChatOverlay component.
 * Once AIChatOverlay is fully migrated, this file can be deleted.
 */

import { supabase } from '@/integrations/supabase/client';

export async function ensureThreadId(): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('[ensureThreadId] Auth error:', authError);
    throw new Error(`Authentication failed: ${authError.message}`);
  }
  if (!user) {
    console.error('[ensureThreadId] No user found');
    throw new Error('Not authenticated');
  }

  console.log('[ensureThreadId] User ID:', user.id);

  // Reuse latest thread or create one
  const { data: existing, error: selectError } = await supabase
    .from('echo_threads')
    .select('id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (selectError) {
    console.error('[ensureThreadId] Select error:', selectError);
    throw new Error(`Failed to query threads: ${selectError.message}`);
  }

  if (existing?.[0]?.id) {
    console.log('[ensureThreadId] Found existing thread:', existing[0].id);
    return existing[0].id;
  }

  console.log('[ensureThreadId] Creating new thread for user:', user.id);
  const { data: created, error } = await supabase
    .from('echo_threads')
    .insert({ user_id: user.id })
    .select('id')
    .single();
  
  if (error) {
    console.error('[ensureThreadId] Insert error:', error);
    throw new Error(`Failed to create thread: ${error.message}`);
  }
  
  if (!created?.id) {
    console.error('[ensureThreadId] No thread ID returned after insert');
    throw new Error('Failed to create thread: No ID returned');
  }

  console.log('[ensureThreadId] Created new thread:', created.id);
  return created.id;
}

export async function persistUserMessage(threadId: string, text: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('[persistUserMessage] Auth error:', authError);
    throw new Error(`Authentication failed: ${authError.message}`);
  }
  if (!user) {
    console.error('[persistUserMessage] No user found');
    throw new Error('Not authenticated');
  }
  
  console.log('[persistUserMessage] Inserting message for thread:', threadId);
  const { error } = await supabase
    .from('echo_messages')
    .insert({ 
      thread_id: threadId, 
      user_id: user.id, 
      role: 'user', 
      content: text 
    });
  
  if (error) {
    console.error('[persistUserMessage] Insert error:', error);
    throw new Error(`Failed to persist user message: ${error.message}`);
  }
  console.log('[persistUserMessage] Message persisted successfully');
}

export async function persistAssistantMessage(threadId: string, text: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('[persistAssistantMessage] Auth error:', authError);
    throw new Error(`Authentication failed: ${authError.message}`);
  }
  if (!user) {
    console.error('[persistAssistantMessage] No user found');
    throw new Error('Not authenticated');
  }
  
  console.log('[persistAssistantMessage] Inserting message for thread:', threadId);
  const { error } = await supabase
    .from('echo_messages')
    .insert({ 
      thread_id: threadId, 
      user_id: user.id, 
      role: 'assistant', 
      content: text 
    });
  
  if (error) {
    console.error('[persistAssistantMessage] Insert error:', error);
    throw new Error(`Failed to persist assistant message: ${error.message}`);
  }
  console.log('[persistAssistantMessage] Message persisted successfully');
}

export async function loadThreadMessages(threadId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('echo_messages')
    .select('id, role, content, created_at')
    .eq('thread_id', threadId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}
