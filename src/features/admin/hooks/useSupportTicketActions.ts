import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { invalidateAdminQueues } from '../lib/adminQueueRefresh';
import { SUPPORT_TICKETS_KEY, SUPPORT_THREAD_KEY, type SupportStatus } from './useSupportTickets';

/**
 * One reply / status path for a support ticket, shared by the drawer and the
 * Inbox row (BRIEF_INBOX_WORK_THE_QUEUE 2.4).
 */
export function useSupportTicketActions() {
  const qc = useQueryClient();

  const refresh = (ticketId: string) => {
    qc.invalidateQueries({ queryKey: SUPPORT_THREAD_KEY(ticketId) });
    qc.invalidateQueries({ queryKey: SUPPORT_TICKETS_KEY });
    void invalidateAdminQueues(qc);
  };

  const sendReply = async (ticket: { id: string; user_id: string }, adminId: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const { error } = await supabase.from('support_messages').insert({
      ticket_id: ticket.id,
      sender_id: adminId,
      sender_role: 'admin',
      body: trimmed,
    });
    if (error) throw error;

    const snippet = trimmed.length > 140 ? trimmed.slice(0, 140) + '\u2026' : trimmed;
    await supabase.from('notifications').insert({
      user_id: ticket.user_id,
      recipient_actor_id: ticket.user_id,
      recipient_actor_type: 'personal',
      actor_id: adminId,
      type: 'support_reply',
      title: 'replied to your request',
      message: snippet,
      entity_type: 'support_ticket',
      entity_id: ticket.id,
      data: { ticket_id: ticket.id },
    });

    // Email (fail soft)
    supabase.functions
      .invoke('support-reply-notify', { body: { ticketId: ticket.id, messageBody: trimmed } })
      .catch((e) => console.warn('support-reply-notify failed', e));

    refresh(ticket.id);
  };

  const setStatus = async (ticketId: string, next: SupportStatus) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status: next,
        // Stamped on close so the Inbox's Flow and Done view can time it;
        // cleared when the ticket is reopened.
        resolved_at: next === 'resolved' || next === 'closed' ? new Date().toISOString() : null,
      } as never)
      .eq('id', ticketId);
    if (error) throw error;
    refresh(ticketId);
  };

  return { sendReply, setStatus };
}
