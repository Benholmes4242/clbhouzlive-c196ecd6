/**
 * Echo History Fetchers
 * Single source of truth for chat and swing history data
 */

import { supabase } from '@/integrations/supabase/client';

export type ChatItem = {
  id: string;
  preview_text: string;
  created_at: string;
};

export type SwingItem = {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

type ChatSummary = {
  thread_id: string;
  last_user?: string;
  last_assistant?: string;
  last_at: string;
};

export async function fetchChatHistory(limit = 20): Promise<ChatItem[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch conversations from the original conversations table
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at, messages')
      .eq('user_id', user.id)
      .eq('conversation_type', 'chat')
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    if (!conversations?.length) return [];

    // Convert conversations to ChatItem format
    return conversations.map(conv => {
      const messages = Array.isArray(conv.messages) ? conv.messages : [];
      const lastMessage = messages[messages.length - 1] as any;
      const preview = lastMessage?.content || conv.title || 'Empty conversation';
      
      return {
        id: conv.id,
        preview_text: String(preview)
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80) + (String(preview).length > 80 ? '…' : ''),
        created_at: conv.updated_at || conv.created_at
      };
    });
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

  return (data ?? []).map(d => ({
    id: d.id,
    title: 'Swing Analysis',
    thumbnail_url: d.video_url,
    created_at: d.created_at
  }));
}
