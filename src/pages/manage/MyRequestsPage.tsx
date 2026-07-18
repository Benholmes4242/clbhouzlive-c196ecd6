import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatRelativeAgoLong } from '@/i18n/format';
import { LifeBuoy, ChevronRight, Trash2 } from 'lucide-react';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useMyRequestsList, useHideMyRequest, type MyRequestStatus } from '@/hooks/useMyRequests';

const INK = '#0F172A';
const INK_55 = '#64748B';
const CARD_BORDER = 'rgba(15,23,42,0.07)';
const HAIR = 'rgba(15,23,42,0.08)';

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  account: 'Account',
  handicap: 'Handicap / WHS',
  billing: 'Billing',
  report: 'Report',
  other: 'Other',
};

function statusStyle(s: MyRequestStatus): { label: string; bg: string; fg: string } {
  if (s === 'open') return { label: 'Open', bg: 'rgba(245,158,11,0.14)', fg: '#B45309' };
  if (s === 'in_progress') return { label: 'In progress', bg: 'rgba(245,158,11,0.14)', fg: '#B45309' };
  if (s === 'resolved') return { label: 'Resolved', bg: 'rgba(15,23,42,0.06)', fg: INK_55 };
  return { label: 'Closed', bg: 'rgba(15,23,42,0.06)', fg: INK_55 };
}

function relTime(iso: string): string {
  try { return formatRelativeAgoLong(iso); } catch { return ''; }
}

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useMyRequestsList();
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
          <div className="text-[13px]" style={{ color: INK_55 }}>Loading your requests...</div>
        )}

        {!isLoading && tickets.length === 0 && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
          >
            <div className="flex justify-center mb-3">
              <LifeBuoy size={32} style={{ color: INK }} />
            </div>
            <h3 className="text-[16px] font-semibold mb-1" style={{ color: INK }}>
              No requests yet
            </h3>
            <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: INK_55 }}>
              Need help? Contact support and we'll get back to you.
            </p>
            <button
              type="button"
              onClick={() => navigate('/manage/contact')}
              className="w-full min-h-[44px] rounded-xl text-[15px] font-semibold text-white"
              style={{ background: INK }}
            >
              Contact support
            </button>
          </div>
        )}

        {!isLoading && tickets.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}
          >
            {tickets.map((t, i) => {
              const status = statusStyle(t.status);
              const cat = CATEGORY_LABELS[t.category] ?? t.category;
              const unread = t.last_sender === 'admin';
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate(`/support/thread/${t.id}`)}
                  className="w-full text-left flex items-start gap-3 px-4 py-3"
                  style={{ borderTop: i === 0 ? 'none' : `0.5px solid ${HAIR}` }}
                >
                  <div className="mt-1.5 shrink-0" style={{ width: 8, height: 8 }}>
                    {unread && (
                      <span
                        style={{
                          display: 'block', width: 8, height: 8, borderRadius: '50%',
                          background: '#B45309',
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
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
                    <div
                      className="text-[15px] font-semibold truncate"
                      style={{ color: INK }}
                    >
                      {t.subject}
                    </div>
                    {t.snippet && (
                      <div
                        className="text-[13px] mt-0.5 line-clamp-1"
                        style={{ color: INK_55 }}
                      >
                        {t.snippet}
                      </div>
                    )}
                    <div className="text-[12px] mt-1" style={{ color: INK_55 }}>
                      Updated {relTime(t.last_message_at)}
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 mt-3" style={{ color: INK_55 }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ManagePageShell>
  );
}
