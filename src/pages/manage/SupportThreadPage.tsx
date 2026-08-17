import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatMonthDayHm24 } from '@/i18n/format';
import { Send } from 'lucide-react';
import { toast } from '@/lib/toast';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  useMyRequestThread,
  useMyRequestReply,
  type MyRequestStatus,
} from '@/hooks/useMyRequests';
import { A } from '@/features/courses/components/holes/analytical/tokens';



const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  account: 'Account',
  handicap: 'Handicap / WHS',
  billing: 'Billing',
  report: 'Report',
  other: 'Other',
};

function statusStyle(s: MyRequestStatus): { label: string; fg: string } {
  if (s === 'open' || s === 'in_progress')
    return { label: s === 'open' ? 'Open' : 'In progress', fg: A.INK };
  return { label: s === 'resolved' ? 'Resolved' : 'Closed', fg: A.DIM };
}

export default function SupportThreadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  // SETTLED IS NOT "NOT LOADING": the thread query is gated on the route id.
  const { data, isLoading: fetching, isFetched, isError, refetch } = useMyRequestThread(id ?? null);
  const isLoading = !isFetched || fetching;
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
            style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
          >
            <h3 className="text-[16px] font-semibold mb-1" style={{ color: A.INK }}>
              Couldn't load this request
            </h3>
            <p className="text-[13px] mt-1 mb-3" style={{ color: A.MUTE }}>
              Check your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              className="text-[13px] font-semibold"
              style={{ color: A.INK }}
            >
              Retry
            </button>
          </div>
        </div>
      </ManagePageShell>
    );
  }

  // eslint-disable-next-line settled/no-not-loading-empty-check -- isLoading is derived as !isFetched || fetching above.
  if (!isLoading && !ticket) {
    return (
      <ManagePageShell title="Request">
        <div className="px-4 pt-6">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
          >
            <h3 className="text-[16px] font-semibold mb-1" style={{ color: A.INK }}>
              Request not found
            </h3>
            <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: A.MUTE }}>
              This request may have been removed, or you may not have access to it.
            </p>
            <button
              type="button"
              onClick={() => navigate('/manage/requests')}
              className="w-full min-h-[44px] rounded-xl text-[15px] font-semibold text-white"
              style={{ background: A.INK }}
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
            style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[8px] uppercase tracking-[0.16em]"
                style={{ fontWeight: 700, color: A.DIM }}
              >
                {cat}
              </span>
              <span
                className="text-[8px] uppercase tracking-[0.16em]"
                style={{ fontWeight: 700, color: status.fg }}
              >
                {status.label}
              </span>
            </div>
            <div className="mt-2 text-[15px] font-semibold" style={{ color: A.INK }}>
              {ticket.subject}
            </div>
          </div>
        )}

        <div ref={scrollRef} className="space-y-3">
          {isLoading && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16 w-2/3 self-start rounded-2xl" />
              <Skeleton className="h-12 w-1/2 self-end rounded-2xl" />
              <Skeleton className="h-20 w-3/4 self-start rounded-2xl" />
            </div>
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
                  style={{ color: A.MUTE }}
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
                    background: mine ? A.INK : '#fff',
                    color: mine ? '#fff' : A.INK,
                    border: mine ? 'none' : `1px solid ${A.BORDER}`,
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
              <div className="text-[11.5px] mb-2 px-1" style={{ color: A.MUTE }}>
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
                  background: A.PANEL,
                  border: `1px solid ${A.BORDER}`,
                  color: A.INK,
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
                  background: A.INK,
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
