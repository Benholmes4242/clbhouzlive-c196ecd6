/**
 * Echo History Fetchers
 * Single source of truth for chat and swing history data
 */

import { supabase } from '@/integrations/supabase/client';

export type ChatItem = {
  id: string;
  title: string;           // First user message (question)
  subtitle: string;        // First assistant reply excerpt
  preview_text: string;    // Deprecated, kept for compatibility
  created_at: string;
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
 * Fetch from legacy conversations table
 */
async function fromConversations(limit = 20): Promise<ChatItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at, messages, conversation_type')
    .eq('user_id', user.id)
    .eq('conversation_type', 'chat')
    .order('updated_at', { ascending: false })
    .limit(limit);
  
  if (error || !data?.length) return [];
  
  return data.map((conv: any) => {
    const msgs = Array.isArray(conv.messages) ? conv.messages : [];
    const firstUser = msgs.find((m: any) => m.role === 'user');
    const firstAssistant = msgs.find((m: any) => m.role === 'assistant');
    
    const titleRaw = firstUser?.content ?? conv.title ?? '(No question)';
    const subtitleRaw = firstAssistant?.content ?? '';
    
    const title = stripMarkdown(titleRaw).slice(0, 100);
    const subtitle = stripMarkdown(subtitleRaw).slice(0, 120);
    
    return {
      id: conv.id,
      title,
      subtitle,
      preview_text: subtitle || title, // Fallback for compatibility
      created_at: conv.updated_at ?? conv.created_at
    };
  });
}

/**
 * Fetch from new echo_threads/echo_messages tables
 */
async function fromThreads(limit = 20): Promise<ChatItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data: allMessages, error } = await supabase
    .from('echo_messages')
    .select('thread_id, role, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  
  if (error || !allMessages?.length) return [];
  
  // Group messages by thread_id
  const threadMap = new Map<string, any[]>();
  for (const msg of allMessages) {
    if (!threadMap.has(msg.thread_id)) {
      threadMap.set(msg.thread_id, []);
    }
    threadMap.get(msg.thread_id)!.push(msg);
  }
  
  // Build items with first user/assistant messages
  const items: ChatItem[] = [];
  const threads = Array.from(threadMap.entries())
    .sort((a, b) => {
      const aLast = a[1][a[1].length - 1].created_at;
      const bLast = b[1][b[1].length - 1].created_at;
      return bLast.localeCompare(aLast);
    })
    .slice(0, limit);
  
  for (const [threadId, messages] of threads) {
    const firstUser = messages.find(m => m.role === 'user');
    const firstAssistant = messages.find(m => m.role === 'assistant');
    
    const titleRaw = firstUser?.content ?? '(No question)';
    const subtitleRaw = firstAssistant?.content ?? '';
    
    const title = stripMarkdown(titleRaw).slice(0, 100);
    const subtitle = stripMarkdown(subtitleRaw).slice(0, 120);
    
    items.push({
      id: threadId,
      title,
      subtitle,
      preview_text: subtitle || title,
      created_at: messages[messages.length - 1].created_at
    });
  }
  
  return items;
}

/**
 * Dual-read strategy: primary from conversations, fallback to threads
 * This ensures backward compatibility during migration
 */
export async function fetchChatHistory(limit = 20): Promise<ChatItem[]> {
  try {
    // Try legacy conversations first (covers existing users)
    const primary = await fromConversations(limit);
    if (primary.length) return primary;
    
    // Fallback to new echo_threads/messages (covers new users after writer switches)
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
    // Extract thumbnail from analysis_results.metadata.videoThumbnail
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
