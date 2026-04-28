/**
 * useEchoHistory - Manages Echo conversation history
 * 
 * Provides:
 * - List conversations (with search)
 * - Get messages for a conversation
 * - Pin/unpin conversations
 * - Delete conversations
 * - Rename conversations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useCallback } from 'react';

export interface EchoConversationRow {
  id: string;
  title: string | null;
  summary: string | null;
  pinned: boolean;
  last_message_at: string;
  created_at: string;
  message_count?: number;
}

export interface EchoMessageRow {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// List conversations
export function useEchoConversations(search?: string) {
  return useQuery({
    queryKey: ['echo', 'conversations', search ?? ''],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      

      let q = supabase
        .from('echo_conversations')
        .select('id, title, summary, pinned, last_message_at, created_at')
        .eq('user_id', user.id)
        .order('pinned', { ascending: false })
        .order('last_message_at', { ascending: false });

      if (search && search.trim().length >= 2) {
        q = q.ilike('title', `%${search.trim()}%`);
      }

      const { data, error } = await q;
      if (error) {
        console.error('[useEchoConversations] Error:', error);
        throw error;
      }

      

      // Get message counts using server-side RPC aggregate
      const conversationIds = (data ?? []).map(c => c.id);
      let messageCounts: Record<string, number> = {};
      
      if (conversationIds.length > 0) {
        const { data: counts, error: countError } = await supabase
          .rpc('echo_message_counts', { conversation_ids: conversationIds });
        
        if (!countError && counts) {
          for (const row of counts) {
            messageCounts[row.conversation_id] = Number(row.message_count) || 0;
          }
        }
      }

      const enriched = (data ?? []).map(c => ({
        ...c,
        message_count: messageCounts[c.id] || 0,
      }));

      // Filter out empty/stub conversations (no messages persisted)
      const visible = enriched.filter(c => c.message_count > 0);

      // Disambiguate duplicate titles by appending date suffix to newer ones.
      // Older conversation keeps the bare title; subsequent collisions get " · {DD MMM}" suffix.
      const seenTitles = new Map<string, number>();
      const sorted = [...visible].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const titleSuffixed = sorted.map((c, sortedIdx) => {
        if (!c.title) return c;
        const norm = c.title.trim().toLowerCase();
        if (!seenTitles.has(norm)) {
          seenTitles.set(norm, sortedIdx);
          return c;
        }
        const dt = new Date(c.created_at);
        const suffix = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        return { ...c, title: `${c.title} · ${suffix}` };
      });

      const titleMap = new Map(titleSuffixed.map(c => [c.id, c.title]));
      return visible.map(c => ({ ...c, title: titleMap.get(c.id) ?? c.title })) as EchoConversationRow[];
    },
    staleTime: 0, // Always refetch when queried
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

// FIX 11: Realtime subscription for cross-tab sync
export function useEchoConversationsRealtime(userId: string | null | undefined, onRefetch: () => void) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('echo-conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'echo_conversations',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Refetch conversations on any change
          onRefetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onRefetch]);
}

// Get messages for a conversation
export function useEchoConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['echo', 'messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('echo_conversation_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useEchoConversationMessages] Error:', error);
        throw error;
      }

      return (data ?? []) as EchoMessageRow[];
    },
    enabled: !!conversationId,
    staleTime: 30_000,
  });
}

// Pin/unpin conversation
export function usePinConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, pinned }: { conversationId: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('echo_conversations')
        .update({ pinned })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
    },
    onError: (error) => {
      console.error('[usePinConversation] Error:', error);
      toast.error('Failed to update pin status');
    },
  });
}

// Delete conversation
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('echo_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
      toast.success('Deleted');
    },
    onError: (error) => {
      console.error('[useDeleteConversation] Error:', error);
      toast.error('Failed to delete conversation');
    },
  });
}

// Rename conversation
export function useRenameConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, title }: { conversationId: string; title: string }) => {
      const { error } = await supabase
        .from('echo_conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
    },
    onError: (error) => {
      console.error('[useRenameConversation] Error:', error);
      toast.error('Failed to rename conversation');
    },
  });
}

// Create a new conversation
export async function createConversation(userId: string, title?: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('echo_conversations')
    .insert({
      user_id: userId,
      title: title || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[createConversation] Error:', error);
    return null;
  }

  return data?.id ?? null;
}

// Insert a message into a conversation
export async function insertMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<boolean> {
  const { error: msgError } = await supabase
    .from('echo_conversation_messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
    });

  if (msgError) {
    console.error('[insertMessage] Error:', msgError);
    return false;
  }

  // Update last_message_at
  await supabase
    .from('echo_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return true;
}

// Set conversation title if not already set
export async function setConversationTitleIfEmpty(conversationId: string, title: string): Promise<void> {
  await supabase
    .from('echo_conversations')
    .update({ title: title.slice(0, 48) })
    .eq('id', conversationId)
    .is('title', null);
}
