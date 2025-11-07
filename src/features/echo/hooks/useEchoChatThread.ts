import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Message = { role: 'user' | 'assistant'; content: string; created_at: string };

export function useEchoChatThread(id: string) {
  return useQuery({
    queryKey: ['echo-thread', id],
    queryFn: async () => {
      // Try common table name variations
      const chatTables = ['echo_threads', 'echo_chats', 'ai_chats', 'conversations'];
      const msgTables = ['echo_messages', 'echo_chat_messages', 'ai_chat_messages'];

      let thread = null;
      let threadError = null;

      // Try to find thread metadata in any of the common tables
      for (const table of chatTables) {
        const { data, error } = await supabase
          .from(table as any)
          .select('id, created_at, user_id')
          .eq('id', id)
          .single();
        
        if (!error && data) {
          thread = data;
          break;
        }
        threadError = error;
      }

      if (!thread) throw threadError || new Error('Thread not found in any table');

      // Try to find messages in any of the common tables
      let messages: Message[] = [];
      let msgsError = null;

      for (const table of msgTables) {
        const { data: msgs, error } = await supabase
          .from(table as any)
          .select('role, content, created_at, chat_id, thread_id, conversation_id')
          .or(`chat_id.eq.${id},thread_id.eq.${id},conversation_id.eq.${id}`)
          .order('created_at', { ascending: true });

        if (!error && msgs && msgs.length > 0) {
          messages = msgs.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
            created_at: m.created_at,
          }));
          break;
        }
        msgsError = error;
      }

      // If we found the thread but no messages, that's okay (empty chat)
      // Only throw if we got an actual error (not just empty result)
      if (messages.length === 0 && msgsError && msgsError.code !== 'PGRST116') {
        console.warn('[useEchoChatThread] Messages error:', msgsError);
      }

      return { meta: thread, messages };
    },
    retry: 1,
  });
}
