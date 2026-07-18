import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export type MyRequestStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface MyRequestTicket {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  status: MyRequestStatus;
  last_sender: 'user' | 'admin';
  last_message_at: string;
  created_at: string;
  snippet: string | null;
}

export interface MyRequestMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'user' | 'admin';
  body: string;
  created_at: string;
}

export const MY_REQUESTS_KEY = ['my-requests', 'list'] as const;
export const MY_REQUEST_THREAD_KEY = (id: string | null) =>
  ['my-requests', 'thread', id] as const;

export function useMyRequestsList() {
  const { user } = useSupabaseSession();
  const uid = user?.id ?? null;
  return useQuery({
    queryKey: [...MY_REQUESTS_KEY, uid],
    enabled: !!uid,
    queryFn: async (): Promise<MyRequestTicket[]> => {
      if (!uid) return [];
      const sb: any = supabase;
      const { data: tickets, error } = await sb
        .from('support_tickets')
        .select('id, user_id, category, subject, status, last_sender, last_message_at, created_at')
        .eq('user_id', uid)
        .is('user_hidden_at', null)
        .order('last_message_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (tickets ?? []) as any[];
      if (rows.length === 0) return [];
      const ids = rows.map((t) => t.id);
      const { data: firstMsgs } = await sb
        .from('support_messages')
        .select('ticket_id, body, created_at')
        .in('ticket_id', ids)
        .order('created_at', { ascending: true });
      const snippetMap = new Map<string, string>();
      (firstMsgs ?? []).forEach((m: any) => {
        if (!snippetMap.has(m.ticket_id)) snippetMap.set(m.ticket_id, m.body);
      });
      return rows.map((t) => ({
        ...t,
        status: t.status as MyRequestStatus,
        last_sender: t.last_sender as 'user' | 'admin',
        snippet: snippetMap.get(t.id) ?? null,
      }));
    },
    staleTime: 30_000,
  });
}

export function useMyRequestThread(ticketId: string | null) {
  return useQuery({
    queryKey: MY_REQUEST_THREAD_KEY(ticketId),
    enabled: !!ticketId,
    queryFn: async (): Promise<{
      ticket: MyRequestTicket | null;
      messages: MyRequestMessage[];
    }> => {
      if (!ticketId) return { ticket: null, messages: [] };
      const sb: any = supabase;
      const { data: ticket } = await sb
        .from('support_tickets')
        .select('id, user_id, category, subject, status, last_sender, last_message_at, created_at')
        .eq('id', ticketId)
        .maybeSingle();
      if (!ticket) return { ticket: null, messages: [] };
      const { data: messages, error } = await sb
        .from('support_messages')
        .select('id, ticket_id, sender_id, sender_role, body, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return {
        ticket: { ...ticket, snippet: null } as MyRequestTicket,
        messages: (messages ?? []) as MyRequestMessage[],
      };
    },
    staleTime: 10_000,
  });
}

export function useMyRequestReply() {
  const qc = useQueryClient();
  const { user } = useSupabaseSession();
  const uid = user?.id ?? null;
  return async (ticketId: string, body: string) => {
    const trimmed = body.trim();
    if (!uid || !ticketId || !trimmed) return;
    const { error } = await supabase.from('support_messages').insert({
      ticket_id: ticketId,
      sender_id: uid,
      sender_role: 'user',
      body: trimmed,
    });
    if (error) throw error;
    await Promise.all([
      qc.invalidateQueries({ queryKey: MY_REQUEST_THREAD_KEY(ticketId) }),
      qc.invalidateQueries({ queryKey: [...MY_REQUESTS_KEY, uid] }),
    ]);
  };
}
