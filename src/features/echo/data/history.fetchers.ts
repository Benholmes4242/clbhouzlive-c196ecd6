/**
 * @deprecated LEGACY - Echo History Fetchers
 * 
 * ⚠️ THIS FILE IS DEPRECATED - DO NOT USE FOR NEW CODE
 * 
 * This file fetches from the LEGACY echo_threads table.
 * New code should use:
 *   - Hook: useEchoConversations from useEchoHistory.ts
 *   - Table: echo_conversations + echo_conversation_messages
 * 
 * Kept only for backwards compatibility. Can be deleted once all
 * references to fetchChatHistory are removed.
 */

import { supabase } from '@/integrations/supabase/client';

export type ChatItem = {
  id: string;
  title: string;           // First user message (question)
  subtitle: string;        // First assistant reply excerpt
  preview_text: string;    // Deprecated, kept for compatibility
  created_at: string;
  message_count?: number;  // Optional message count
  has_response?: boolean;  // Whether thread has any assistant replies
  relative_date?: string;  // Server-formatted relative date
};

export type SwingItem = {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')        // remove code blocks
    .replace(/[*_#>`~\-]+/g, '')           // remove md markers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')    // [text](link) → text
    .trim();
}

/**
 * Fetch from echo_threads using RPC function for enriched data
 */
async function fromThreads(limit = 20): Promise<ChatItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  // Use the RPC function that provides enriched data
  const { data, error } = await supabase.rpc('echo_history_list', {
    limit_rows: limit
  });
  
  if (error || !data?.length) {
    // Fallback to direct query if RPC doesn't exist
    return fromThreadsDirect(limit);
  }
  
  return data.map((row: any) => {
    const titleRaw = row.first_user_question ?? '(No question)';
    const subtitleRaw = row.preview_snippet ?? '';
    
    const title = stripMarkdown(titleRaw).slice(0, 100);
    const subtitle = stripMarkdown(subtitleRaw);
    
    return {
      id: row.thread_id,
      title,
      subtitle: row.has_response ? subtitle : '(No response yet)',
      preview_text: row.has_response ? subtitle : '(No response yet)',
      created_at: row.last_activity_at,
      message_count: row.message_count,
      has_response: row.has_response,
      relative_date: row.relative_date
    };
  });
}

/**
 * Direct fallback query to echo_threads
 */
async function fromThreadsDirect(limit = 20): Promise<ChatItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: threads, error } = await supabase
    .from('echo_threads')
    .select('id, first_user_question, created_at, last_activity_at, has_response, message_count')
    .eq('user_id', user.id)
    .order('last_activity_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !threads?.length) return [];

  // Build items from thread data
  const items: ChatItem[] = threads.map(thread => {
    const title = stripMarkdown(thread.first_user_question ?? '(No question)').slice(0, 100);

    return {
      id: thread.id,
      title,
      subtitle: thread.has_response ? '' : '(No response yet)',
      preview_text: title,
      created_at: thread.last_activity_at || thread.created_at,
      has_response: thread.has_response || false,
      message_count: thread.message_count || 0
    };
  });

  return items;
}

/**
 * Fetch chat history from echo_threads
 */
export async function fetchChatHistory(limit = 20): Promise<ChatItem[]> {
  try {
    return fromThreads(limit);
  } catch (error) {
    console.error('[fetchChatHistory] Error:', error);
    throw error;
  }
}

export async function fetchSwingHistory(limit = 20): Promise<SwingItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('pro_ai_analyses')
    .select('id, video_url, created_at, analysis_results')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map(d => {
    const results = d.analysis_results as any;
    const metadata = results?.metadata;
    const thumbnailUrl = metadata?.videoThumbnail || null;
    
    return {
      id: d.id,
      title: 'Swing Analysis',
      thumbnail_url: thumbnailUrl,
      created_at: d.created_at
    };
  });
}
