import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import DetailDrawer from './DetailDrawer';
import StatusPill from './StatusPill';
import {
  SUPPORT_TICKETS_KEY,
  SUPPORT_THREAD_KEY,
  useSupportThread,
  type SupportStatus,
  type SupportTicketRow,
} from '../hooks/useSupportTickets';

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  account: 'Account',
  handicap: 'Handicap / WHS',
  billing: 'Billing',
  report: 'Report a problem',
  other: 'Other',
};

const STATUS_OPTIONS: { id: SupportStatus; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
];

function statusTone(s: SupportStatus): 'warn' | 'ok' | 'neutral' {
  if (s === 'open') return 'warn';
  if (s === 'in_progress') return 'warn';
  if (s === 'resolved' || s === 'closed') return 'ok';
  return 'neutral';
}

function relTime(iso: string): string {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return ''; }
}

interface Props {
  ticket: SupportTicketRow | null;
  onClose: () => void;
}

export default function SupportTicketDrawer({ ticket, onClose }: Props) {
  const qc = useQueryClient();
  const { user } = useSupabaseSession();
  const { data: messages = [], isLoading } = useSupportThread(ticket?.id ?? null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [localStatus, setLocalStatus] = useState<SupportStatus | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBody('');
    setLocalStatus(null);
  }, [ticket?.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, ticket?.id]);

  const status = (localStatus ?? ticket?.status ?? 'open') as SupportStatus;

  const userName =
    ticket?.profile?.display_name || ticket?.profile?.username || 'User';

  const handleStatus = async (next: SupportStatus) => {
    if (!ticket || next === status) return;
    setStatusBusy(true);
    const prev = status;
    setLocalStatus(next);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: next })
        .eq('id', ticket.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: SUPPORT_TICKETS_KEY });
    } catch (e: any) {
      setLocalStatus(prev);
      toast.error(e?.message ?? 'Failed to update status');
    } finally {
      setStatusBusy(false);
    }
  };

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!ticket || !user?.id || !trimmed) return;
    setSending(true);
    try {
      const { error } = await supabase.from('support_messages').insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_role: 'admin',
        body: trimmed,
      });
      if (error) throw error;

      // Notify user in-app
      const snippet = trimmed.length > 140 ? trimmed.slice(0, 140) + '…' : trimmed;
      await supabase.from('notifications').insert({
        user_id: ticket.user_id,
        recipient_actor_id: ticket.user_id,
        recipient_actor_type: 'personal',
        actor_id: user.id,
        type: 'support_reply',
        title: 'replied to your request',
        message: snippet,
        entity_type: 'support_ticket',
        entity_id: ticket.id,
        data: { ticket_id: ticket.id },
      });

      // Email (fail soft)
      supabase.functions
        .invoke('support-reply-notify', {
          body: { ticketId: ticket.id, messageBody: trimmed },
        })
        .catch((e) => console.warn('support-reply-notify failed', e));

      setBody('');
      qc.invalidateQueries({ queryKey: SUPPORT_THREAD_KEY(ticket.id) });
      qc.invalidateQueries({ queryKey: SUPPORT_TICKETS_KEY });
      toast.success('Reply sent');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const categoryLabel = ticket ? CATEGORY_LABELS[ticket.category] ?? ticket.category : '';

  const header = ticket ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SquircleAvatar
          src={ticket.profile?.profile_photo_url ?? undefined}
          alt={userName}
          userId={ticket.user_id}
          size={36}
          hairlineRing
        />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
          <span style={{ color: t.ink, fontSize: 14, fontWeight: 600 }}>{userName}</span>
          {ticket.profile?.username && (
            <span style={{ color: t.inkFaint, fontSize: 11 }}>@{ticket.profile.username}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 11, fontWeight: 600, color: t.inkMuted,
            padding: '2px 8px', borderRadius: 999,
            background: t.neutralSoft, textTransform: 'uppercase', letterSpacing: 0.3,
          }}
        >
          {categoryLabel}
        </span>
        <StatusPill tone={statusTone(status)}>{STATUS_OPTIONS.find(s => s.id === status)?.label ?? status}</StatusPill>
        <span style={{ color: t.inkFaint, fontSize: 11 }}>
          Opened {relTime(ticket.created_at)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {STATUS_OPTIONS.map((opt) => {
          const active = opt.id === status;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={statusBusy || active}
              onClick={() => handleStatus(opt.id)}
              style={{
                padding: '6px 10px', borderRadius: t.radius.md,
                border: `1px solid ${active ? t.ink : t.line}`,
                background: active ? t.ink : t.surface,
                color: active ? t.surface : t.ink,
                fontSize: 11, fontWeight: 600,
                cursor: active || statusBusy ? 'default' : 'pointer',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  const composer = ticket ? (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply..."
        rows={3}
        style={{
          flex: 1, resize: 'vertical', minHeight: 60, maxHeight: 200,
          padding: '10px 12px', borderRadius: t.radius.md,
          border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
          fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit', outline: 'none',
        }}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!body.trim() || sending}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 14px', borderRadius: t.radius.md,
          background: t.ink, color: t.surface, border: 'none',
          fontSize: 13, fontWeight: 600,
          cursor: !body.trim() || sending ? 'not-allowed' : 'pointer',
          opacity: !body.trim() || sending ? 0.55 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        <Send size={14} /> {sending ? 'Sending' : 'Send'}
      </button>
    </div>
  ) : null;

  return (
    <DetailDrawer
      open={!!ticket}
      onClose={onClose}
      title={ticket?.subject}
      subtitle={undefined}
      footer={composer ?? undefined}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {header}

        <div
          ref={scrollRef}
          style={{
            display: 'flex', flexDirection: 'column', gap: 10,
            paddingTop: 8, borderTop: `1px solid ${t.line}`,
          }}
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{
                height: 48, background: t.canvas, borderRadius: t.radius.md,
                animation: 'admin-pulse 1.4s ease-in-out infinite',
              }} />
            ))
          ) : messages.length === 0 ? (
            <div style={{ color: t.inkFaint, fontSize: 13, padding: 20, textAlign: 'center' }}>
              No messages yet.
            </div>
          ) : messages.map((m) => {
            const isAdmin = m.sender_role === 'admin';
            const name = m.sender_profile?.display_name || m.sender_profile?.username || (isAdmin ? 'Support' : 'User');
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isAdmin ? 'flex-end' : 'flex-start',
                  gap: 3,
                }}
              >
                <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', fontSize: 11 }}>
                  <span style={{ color: t.inkMuted, fontWeight: 600 }}>{name}</span>
                  <span style={{ color: t.inkFaint }}>
                    {(() => { try { return format(new Date(m.created_at), 'MMM d, HH:mm'); } catch { return ''; } })()}
                  </span>
                </div>
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 12px',
                    borderRadius: 14,
                    background: isAdmin ? t.ink : t.canvas,
                    color: isAdmin ? t.surface : t.ink,
                    fontSize: 13, lineHeight: 1.5,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    border: isAdmin ? 'none' : `1px solid ${t.line}`,
                  }}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DetailDrawer>
  );
}
