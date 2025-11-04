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

    // 1) Get the user's threads (newest first)
    const { data: threads, error: thErr } = await supabase
      .from('echo_threads')
      .select('id, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);
    
    if (thErr) throw thErr;
    if (!threads?.length) return [];

    const ids = threads.map(t => t.id);

    // 2) Fetch last two messages per thread (user + assistant)
    const { data: msgs, error: msgErr } = await supabase
      .from('echo_messages')
      .select('thread_id, role, content, created_at')
      .in('thread_id', ids)
      .order('created_at', { ascending: false });
    
    if (msgErr) throw msgErr;

    // 3) Reduce to summaries
    const byThread = new Map<string, ChatSummary>();
    for (const m of msgs || []) {
      let s = byThread.get(m.thread_id);
      if (!s) {
        s = { thread_id: m.thread_id, last_at: m.created_at };
        byThread.set(m.thread_id, s);
      }
      if (m.role === 'assistant' && !s.last_assistant) s.last_assistant = m.content;
      if (m.role === 'user' && !s.last_user) s.last_user = m.content;
    }

    const ordered = Array.from(byThread.values())
      .sort((a, b) => (a.last_at < b.last_at ? 1 : -1))
      .slice(0, limit);

    // 4) Convert to ChatItem format
    return ordered.map(s => ({
      id: s.thread_id,
      preview_text: (s.last_user || s.last_assistant || 'Empty conversation')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80) + ((s.last_user || s.last_assistant || '').length > 80 ? '…' : ''),
      created_at: s.last_at
    }));
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
