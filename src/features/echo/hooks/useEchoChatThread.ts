import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type EchoMsg = { id?: string; role: 'user' | 'assistant' | 'system'; content: string; created_at?: string };
type Thread = { id: string; created_at: string };

function mapJsonbMessages(jsonb: any[]): EchoMsg[] {
  if (!Array.isArray(jsonb)) return [];
  return jsonb.map((m: any, i: number) => {
    const rawRole = (m.role || m.type || '').toLowerCase();
    const role: 'user' | 'assistant' | 'system' = rawRole === 'user' ? 'user' : rawRole === 'system' ? 'system' : 'assistant';
    return {
      id: m.id ?? String(i),
      role,
      content: m.content ?? m.text ?? '',
      created_at: m.timestamp ?? m.created_at ?? null,
    };
  }).filter(m => m.content);
}

async function fetchConversationById(id: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, user_id, title, created_at, updated_at, messages, conversation_type')
    .eq('id', id)
    .single();
  if (error) return { data: null, error };
  if (!data) return { data: null, error: null };
  return { data, error: null };
}

async function fetchRelationalByThreadId(id: string) {
  // 1) find thread by id
  const { data: thread, error: thErr } = await supabase
    .from('echo_threads')
    .select('id, created_at')
    .eq('id', id)
    .single();

  if (thErr || !thread) return { thread: null, messages: [], error: thErr ?? null };

  // 2) load messages for that thread
  const { data: msgs, error: msgErr } = await supabase
    .from('echo_messages')
    .select('id, role, content, created_at')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true });

  return { thread, messages: msgs ?? [], error: msgErr ?? null };
}

export function useEchoChatThread(chatId: string | undefined) {
  return useQuery({
    queryKey: ['echo-chat-thread', chatId],
    enabled: Boolean(chatId),
    queryFn: async () => {
      if (!chatId) throw new Error('No chat id');

      // PATH A: Legacy conversations (JSONB)
      const { data: conv, error: convErr } = await fetchConversationById(chatId);
      if (conv && conv.conversation_type === 'chat') {
        const messages = mapJsonbMessages(conv.messages || []);
        return {
          source: 'conversations',
          thread: { id: conv.id, created_at: conv.created_at } as Thread,
          messages,
        };
      }

      // PATH B: Relational echo_threads + echo_messages
      const { thread, messages, error: relErr } = await fetchRelationalByThreadId(chatId);
      if (thread) {
        return { source: 'relational', thread, messages };
      }

      // If both miss, surface the better error
      if (convErr) throw convErr;
      if (relErr) throw relErr;
      return { source: 'none', thread: null, messages: [] as EchoMsg[] };
    },
  });
}
