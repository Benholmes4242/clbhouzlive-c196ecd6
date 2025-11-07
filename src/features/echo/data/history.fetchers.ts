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
    const last = msgs[msgs.length - 1] as any;
    const raw = (last?.content ?? conv.title ?? 'Empty conversation') + '';
    const preview = raw.replace(/\s+/g, ' ').trim();
    return {
      id: conv.id,
      preview_text: preview.slice(0, 80) + (preview.length > 80 ? '…' : ''),
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
  
  const { data: latest, error } = await supabase
    .from('echo_messages')
    .select('thread_id, role, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500);
  
  if (error || !latest?.length) return [];
  
  const seen = new Set<string>();
  const items: ChatItem[] = [];
  
  for (const m of latest) {
    if (seen.has(m.thread_id)) continue;
    seen.add(m.thread_id);
    const raw = (m.content ?? 'Empty conversation') + '';
    const preview = raw.replace(/\s+/g, ' ').trim();
    items.push({
      id: m.thread_id,
      preview_text: preview.slice(0, 80) + (preview.length > 80 ? '…' : ''),
      created_at: m.created_at
    });
    if (items.length >= limit) break;
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
