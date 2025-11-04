/**
 * Echo Persistence Service
 * Handles saving and retrieving Echo chat data from Supabase
 */

import { supabase } from '@/integrations/supabase/client';

export async function ensureThreadId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Reuse latest thread or create one
  const { data: existing } = await supabase
    .from('echo_threads')
    .select('id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (existing?.[0]?.id) return existing[0].id;

  const { data: created, error } = await supabase
    .from('echo_threads')
    .insert({ user_id: user.id })
    .select('id')
    .single();
  
  if (error) throw error;
  return created.id;
}

export async function persistUserMessage(threadId: string, text: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('echo_messages')
    .insert({ 
      thread_id: threadId, 
      user_id: user.id, 
      role: 'user', 
      content: text 
    });
  
  if (error) throw error;
}

export async function persistAssistantMessage(threadId: string, text: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  await supabase
    .from('echo_messages')
    .insert({ 
      thread_id: threadId, 
      user_id: user.id, 
      role: 'assistant', 
      content: text 
    })
    .throwOnError();
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
