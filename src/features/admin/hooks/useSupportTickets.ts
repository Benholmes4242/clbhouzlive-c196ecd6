import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const SUPPORT_TICKETS_KEY = ['admin-v2', 'support-tickets'] as const;
export const SUPPORT_THREAD_KEY = (id: string | null) =>
  ['admin-v2', 'support-thread', id] as const;

export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicketRow {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  status: SupportStatus;
  last_sender: 'user' | 'admin';
  last_message_at: string;
  created_at: string;
  profile: {
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
  snippet: string | null;
}

export interface SupportMessageRow {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'user' | 'admin';
  body: string;
  created_at: string;
  sender_profile?: {
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
}

export async function fetchSupportTickets(opts?: { closed?: boolean }): Promise<SupportTicketRow[]> {
  let q: any = supabase
    .from('support_tickets')
    .select('id, user_id, category, subject, status, last_sender, last_message_at, created_at')
    .order('last_message_at', { ascending: false })
    .limit(500);
  if (opts?.closed) q = q.in('status', ['resolved', 'closed']);
  const { data: tickets, error } = await q;
  if (error) throw error;
  if (!tickets || tickets.length === 0) return [];

  const userIds = Array.from(new Set(tickets.map((t: any) => t.user_id)));
  const ticketIds = tickets.map((t: any) => t.id);

  const sb: any = supabase;
  const profilesRes = await sb
    .from('user_profiles')
    .select('user_id, display_name, username, profile_photo_url')
    .in('user_id', userIds);
  const firstMsgsRes = await sb
    .from('support_messages')
    .select('ticket_id, body, created_at')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: true });
  const profiles = (profilesRes.data ?? []) as any[];
  const firstMsgs = (firstMsgsRes.data ?? []) as any[];

  const pMap = new Map<string, SupportTicketRow['profile']>();
  profiles.forEach((p: any) => {
    pMap.set(p.user_id, {
      display_name: p.display_name,
      username: p.username,
      profile_photo_url: p.profile_photo_url,
    });
  });

  const snippetMap = new Map<string, string>();
  (firstMsgs ?? []).forEach((m: any) => {
    if (!snippetMap.has(m.ticket_id)) snippetMap.set(m.ticket_id, m.body);
  });

  return tickets.map((t: any) => ({
    ...t,
    status: t.status as SupportStatus,
    last_sender: t.last_sender as 'user' | 'admin',
    profile: pMap.get(t.user_id) ?? null,
    snippet: snippetMap.get(t.id) ?? null,
  }));
}

export function useSupportTickets() {
  return useQuery({
    queryKey: SUPPORT_TICKETS_KEY,
    queryFn: () => fetchSupportTickets(),
    staleTime: 30_000,
  });
}

export function useSupportThread(ticketId: string | null) {
  return useQuery({
    queryKey: SUPPORT_THREAD_KEY(ticketId),
    enabled: !!ticketId,
    queryFn: async (): Promise<SupportMessageRow[]> => {
      if (!ticketId) return [];
      const sb: any = supabase;
      const { data, error } = await sb
        .from('support_messages')
        .select('id, ticket_id, sender_id, sender_role, body, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const senderIds = Array.from(new Set(rows.map((r) => r.sender_id)));
      if (senderIds.length === 0) return [];
      const { data: profiles } = await sb
        .from('user_profiles')
        .select('user_id, display_name, username, profile_photo_url')
        .in('user_id', senderIds);
      const pMap = new Map<string, any>();
      (profiles ?? []).forEach((p: any) => pMap.set(p.user_id, p));
      return rows.map((r) => ({
        ...r,
        sender_role: r.sender_role as 'user' | 'admin',
        sender_profile: pMap.get(r.sender_id) ?? null,
      }));
    },
    staleTime: 10_000,
  });
}
