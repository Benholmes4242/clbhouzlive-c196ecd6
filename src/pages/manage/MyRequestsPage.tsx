import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatRelativeAgoLong } from '@/i18n/format';
import { LifeBuoy, ChevronRight, Trash2 } from 'lucide-react';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyRequestsList, useHideMyRequest, type MyRequestStatus } from '@/hooks/useMyRequests';
import { A } from '@/features/courses/components/holes/analytical/tokens';


const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  account: 'Account',
  handicap: 'Handicap / WHS',
  billing: 'Billing',
  report: 'Report',
  other: 'Other',
};

/* Status reads as text, not a tinted capsule. Open and In progress are
   deliberately the SAME weight - they are identical today and nothing in the
   data distinguishes them. */
function statusStyle(s: MyRequestStatus): { label: string; fg: string } {
  if (s === 'open') return { label: 'Open', fg: A.INK };
  if (s === 'in_progress') return { label: 'In progress', fg: A.INK };
  if (s === 'resolved') return { label: 'Resolved', fg: A.DIM };
  return { label: 'Closed', fg: A.DIM };
}

function relTime(iso: string): string {
  try { return formatRelativeAgoLong(iso); } catch { return ''; }
}

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useMyRequestsList();
  const hide = useHideMyRequest();
  const tickets = data ?? [];
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
  }, []);

  const handleRemoveClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirmId !== id) {
      setConfirmId(id);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmId((cur) => (cur === id ? null : cur)), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmId(null);
    hide.mutate(id, {
      onSuccess: () => toast.success('Request removed'),
      onError: () => toast.error("Couldn't remove. Try again."),
    });
  };

  return (
    <ManagePageShell title="My requests">
      <div className="px-4 pt-4 pb-0 space-y-3">
        {isLoading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="dark" className="h-[72px] w-full rounded-xl" />
            ))}
          </div>
        )}


        {!isLoading && isError && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
          >
            <p className="text-[15px] font-medium" style={{ color: A.INK }}>Couldn't load your requests</p>
            <p className="text-[13px] mt-1 mb-3" style={{ color: A.MUTE }}>Check your connection and try again.</p>
            <button
              onClick={() => refetch()}
              className="text-[13px] font-semibold"
              style={{ color: A.INK }}
            >
              Retry
            </button>
          </div>
        )}


        {!isLoading && !isError && tickets.length === 0 && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
          >
            <div className="flex justify-center mb-3">
              <LifeBuoy size={32} style={{ color: A.INK }} />
            </div>
            <h3 className="text-[16px] font-semibold mb-1" style={{ color: A.INK }}>
              No requests yet
            </h3>
            <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: A.MUTE }}>
              Need help? Contact support and we'll get back to you.
            </p>
            <button
              type="button"
              onClick={() => navigate('/manage/contact')}
              className="w-full min-h-[44px] rounded-xl text-[15px] font-semibold"
              style={{ background: A.INK, color: A.CANVAS }}
            >
              Contact support
            </button>
          </div>
        )}

        {!isLoading && tickets.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
          >
            {tickets.map((t, i) => {
              const status = statusStyle(t.status);
              const cat = CATEGORY_LABELS[t.category] ?? t.category;
              const unread = t.last_sender === 'admin';
              const confirming = confirmId === t.id;
              return (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/support/thread/${t.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/support/thread/${t.id}`);
                    }
                  }}
                  className="w-full text-left flex items-start gap-3 px-4 py-3 cursor-pointer"
                  style={{ borderTop: i === 0 ? 'none' : `0.5px solid ${A.HAIRLINE}` }}
                >
                  <div className="mt-1.5 shrink-0" style={{ width: 8, height: 8 }}>
                    {unread && (
                      <span
                        style={{
                          display: 'block', width: 8, height: 8, borderRadius: '50%',
                          background: A.INK,
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[11px] uppercase tracking-[0.12em]"
                        style={{ fontWeight: 700, color: A.DIM }}
                      >
                        {cat}
                      </span>
                      <span
                        className="text-[11px] uppercase tracking-[0.12em]"
                        style={{ fontWeight: 700, color: status.fg }}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div
                      className="text-[15px] font-semibold"
                      style={{ color: A.INK, lineHeight: 1.3 }}
                    >
                      {t.subject}
                    </div>
                    {t.snippet && (
                      <div
                        className="text-[13px] mt-0.5 line-clamp-1"
                        style={{ color: A.MUTE }}
                      >
                        {t.snippet}
                      </div>
                    )}
                    <div className="text-[12px] mt-1" style={{ color: A.MUTE }}>
                      Updated {relTime(t.last_message_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleRemoveClick(e, t.id)}
                      aria-label={confirming ? 'Confirm remove request' : 'Remove request'}
                      className="min-h-[32px] px-2 rounded-md text-[11px] font-semibold inline-flex items-center gap-1"
                      style={{
                        color: confirming ? A.RED : A.MUTE,
                        background: 'transparent',
                      }}
                    >
                      {confirming ? 'Remove?' : <Trash2 size={16} />}
                    </button>
                    <ChevronRight size={16} style={{ color: A.MUTE }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ManagePageShell>
  );
}
