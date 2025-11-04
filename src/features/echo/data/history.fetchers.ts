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

export async function fetchChatHistory(limit = 20): Promise<ChatItem[]> {
  try {
    // Chat data is stored in localStorage (not Supabase yet)
    const stored = localStorage.getItem('echo_chat');
    if (!stored) return [];
    
    const conversations = JSON.parse(stored);
    return Object.values(conversations)
      .map((conv: any) => ({
        id: conv.id,
        preview_text: (conv.customTitle || conv.title || 'Untitled conversation')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80) + ((conv.customTitle || conv.title || '').length > 80 ? '…' : ''),
        created_at: conv.createdAt || conv.timestamp || new Date().toISOString()
      }))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
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
