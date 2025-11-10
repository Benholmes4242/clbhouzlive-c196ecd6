/**
 * Thread Details API
 * Fetch full thread data including messages for export
 */

import { supabase } from '@/integrations/supabase/client';

export interface ThreadMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface ThreadDetails {
  thread_id: string;
  title: string;
  created_at: string;
  messages: ThreadMessage[];
}

/**
 * Fetch thread details with all messages (for export)
 */
export async function fetchThreadDetails(threadId: string): Promise<ThreadDetails> {
  // Fetch thread metadata
  const { data: thread, error: threadError } = await supabase
    .from('echo_threads')
    .select('id, created_at')
    .eq('id', threadId)
    .single();

  if (threadError) {
    console.error('Failed to fetch thread:', threadError);
    throw new Error('Failed to fetch thread details');
  }

  // Fetch messages
  const { data: messages, error: messagesError } = await supabase
    .from('echo_messages')
    .select('id, role, content, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error('Failed to fetch messages:', messagesError);
    throw new Error('Failed to fetch thread messages');
  }

  // Generate title from first user message
  const firstUserMsg = (messages || []).find(m => m.role === 'user');
  const title = firstUserMsg?.content.slice(0, 100) || 'Untitled Conversation';

  return {
    thread_id: thread.id,
    title,
    created_at: thread.created_at,
    messages: (messages || []) as ThreadMessage[],
  };
}
