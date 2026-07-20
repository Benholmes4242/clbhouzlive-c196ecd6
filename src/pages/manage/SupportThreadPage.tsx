import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatMonthDayHm24 } from '@/i18n/format';
import { Send } from 'lucide-react';
import { toast } from '@/lib/toast';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  useMyRequestThread,
  useMyRequestReply,
  type MyRequestStatus,
} from '@/hooks/useMyRequests';

const INK = '#0F172A';
const INK_55 = '#64748B';
const CARD_BORDER = 'rgba(15,23,42,0.07)';

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  account: 'Account',
  handicap: 'Handicap / WHS',
  billing: 'Billing',
  report: 'Report',
  other: 'Other',
};

function statusStyle(s: MyRequestStatus): { label: string; bg: string; fg: string } {
  if (s === 'open' || s === 'in_progress')
    return { label: s === 'open' ? 'Open' : 'In progress', bg: 'rgba(245,158,11,0.14)', fg: '#B45309' };
  return { label: s === 'resolved' ? 'Resolved' : 'Closed', bg: 'rgba(15,23,42,0.06)', fg: INK_55 };
}

export default function SupportThreadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data, isLoading, isError, refetch } = useMyRequestThread(id ?? null);
  const postReply = useMyRequestReply();

  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ticket = data?.ticket ?? null;
  const messages = data?.messages ?? [];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, ticket?.id]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!id || !trimmed || sending) return;
    setSending(true);
    try {
      await postReply(id, trimmed);
      setBody('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not send your reply. Please try again.';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  if (!isLoading && isError) {
    return (
      <ManagePageShell title="Request">
        <div className="px-4 pt-6">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
          >
            <h3 className="text-[16px] font-semibold mb-1" style={{ color: INK }}>
              Couldn't load this request
            </h3>
            <p className="text-[13px] mt-1 mb-3" style={{ color: INK_55 }}>
              Check your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              className="text-[13px] font-semibold underline"
              style={{ color: INK }}
            >
              Retry
            </button>
          </div>
        </div>
      </ManagePageShell>
    );
  }

  if (!isLoading && !ticket) {
    return (
      <ManagePageShell title="Request">
        <div className="px-4 pt-6">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
          >
            <h3 className="text-[16px] font-semibold mb-1" style={{ color: INK }}>
              Request not found
            </h3>
            <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: INK_55 }}>
              This request may have been removed, or you may not have access to it.
            </p>
            <button
              type="button"
              onClick={() => navigate('/manage/requests')}
              className="w-full min-h-[44px] rounded-xl text-[15px] font-semibold text-white"
              style={{ background: INK }}
            >
              Back to my requests
            </button>
          </div>
        </div>
      </ManagePageShell>
    );
  }

  const status = statusStyle((ticket?.status ?? 'open') as MyRequestStatus);
  const cat = ticket ? CATEGORY_LABELS[ticket.category] ?? ticket.category : '';
  const isClosed = ticket?.status === 'closed';

  return (
    <ManagePageShell title={ticket?.subject || 'Request'}>
      <div className="px-4 pt-4 pb-40 space-y-4">
        {ticket && (
          <div
            className="rounded-2xl p-4"
            style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-semibold uppercase tracking-[1.2px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(15,23,42,0.06)', color: INK_55 }}
              >
                {cat}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-[1.2px] px-1.5 py-0.5 rounded"
                style={{ background: status.bg, color: status.fg }}
              >
                {status.label}
              </span>
            </div>
            <div className="mt-2 text-[15px] font-semibold" style={{ color: INK }}>
              {ticket.subject}
            </div>
          </div>
        )}

        <div ref={scrollRef} className="space-y-3">
          {isLoading && (
            <div className="text-[13px]" style={{ color: INK_55 }}>Loading conversation...</div>
          )}
          {!isLoading && messages.map((m) => {
            const mine = m.sender_id === user?.id || m.sender_role === 'user';
            return (
              <div
                key={m.id}
                className="flex flex-col"
                style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}
              >
                <div
                  className="text-[11px] mb-1 px-1"
                  style={{ color: INK_55 }}
                >
                  {mine ? 'You' : 'Clbhouz Support'}
                  <span className="mx-1">.</span>
                  {(() => { try { return formatMonthDayHm24(m.created_at); } catch { return ''; } })()}
                </div>
                <div
                  className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words"
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: 16,
                    background: mine ? INK : '#fff',
                    color: mine ? '#fff' : INK,
                    border: mine ? 'none' : `1px solid ${CARD_BORDER}`,
                  }}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Composer */}
      {ticket && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30"
          style={{
            background: 'rgba(244,246,248,0.96)',
            backdropFilter: 'saturate(180%) blur(14px)',
            WebkitBackdropFilter: 'saturate(180%) blur(14px)',
            borderTop: '1px solid rgba(15,23,42,0.08)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
          }}
        >
          <div className="mx-auto w-full md:max-w-[440px] px-4 pt-3">
            {isClosed && (
              <div className="text-[11.5px] mb-2 px-1" style={{ color: INK_55 }}>
                This request was closed. Replying will reopen it.
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="flex-1 p-3 rounded-2xl text-[14.5px] outline-none resize-none leading-relaxed"
                style={{
                  background: '#fff',
                  border: `1px solid ${CARD_BORDER}`,
                  color: INK,
                  minHeight: 48,
                  maxHeight: 160,
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!body.trim() || sending}
                className="inline-flex items-center gap-1.5 rounded-2xl text-white font-semibold text-[13.5px]"
                style={{
                  background: INK,
                  padding: '0 14px',
                  minHeight: 44,
                  opacity: !body.trim() || sending ? 0.5 : 1,
                }}
              >
                <Send size={14} /> {sending ? 'Sending' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ManagePageShell>
  );
}
