import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import DetailDrawer from './DetailDrawer';
import StatusPill from './StatusPill';
import { useModerationActions } from '../hooks/useModerationActions';
import type { ModerationQueueRow, ReportStatus } from '../hooks/useModerationQueue';

interface Props {
  open: boolean;
  onClose: () => void;
  row: ModerationQueueRow | null;
}

function relTime(iso: string | null | undefined) {
  if (!iso) return '—';
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return '—'; }
}

function statusTone(s: ReportStatus) {
  if (s === 'pending') return 'warn' as const;
  if (s === 'reviewing') return 'neutral' as const;
  if (s === 'actioned') return 'ok' as const;
  return 'neutral' as const;
}

export default function ModerationDetailDrawer({ open, onClose, row }: Props) {
  const { setReviewingBulk, dismiss } = useModerationActions();
  const [dismissOpen, setDismissOpen] = useState(false);
  const [note, setNote] = useState('');

  const ids = useMemo(() => (row ? row.reports.map((r) => r.raw.id) : []), [row]);
  const kind = row?.kind;

  const targetTitle = row
    ? row.kind === 'user'
      ? row.targetUser?.display_name || row.targetUser?.username || 'Unknown user'
      : row.targetPost?.author?.display_name || row.targetPost?.author?.username || 'Post'
    : '';

  const subtitle = row
    ? `${row.report_count} report${row.report_count === 1 ? '' : 's'} - ${relTime(row.created_at)}`
    : '';

  const onStartReviewing = () => {
    if (!row || !kind) return;
    setReviewingBulk.mutate({ kind, ids }, { onSuccess: () => onClose() });
  };

  const onDismissConfirm = () => {
    if (!row || !kind) return;
    dismiss.mutate(
      { kind, ids, note },
      {
        onSuccess: () => {
          setDismissOpen(false);
          setNote('');
          onClose();
        },
      },
    );
  };

  return (
    <>
      <DetailDrawer
        open={open}
        onClose={onClose}
        title={targetTitle}
        subtitle={subtitle}
        footer={
          row && row.status !== 'dismissed' && row.status !== 'actioned' ? (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDismissOpen(true)}
                disabled={dismiss.isPending}
                style={{
                  padding: '10px 14px',
                  borderRadius: t.radius.md,
                  border: `1px solid ${t.line}`,
                  background: t.surface,
                  color: t.ink,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dismiss (no violation)
              </button>
              {row.status === 'pending' && (
                <button
                  onClick={onStartReviewing}
                  disabled={setReviewingBulk.isPending}
                  style={{
                    padding: '10px 14px',
                    borderRadius: t.radius.md,
                    border: 'none',
                    background: t.ink,
                    color: t.surface,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Start reviewing
                </button>
              )}
            </div>
          ) : null
        }
      >
        {row && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>

            {/* Target */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.inkFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {row.kind === 'user' ? 'Reported user' : 'Reported post'}
              </div>

              {row.kind === 'user' && row.targetUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: `1px solid ${t.line}`, borderRadius: t.radius.md, background: t.canvas }}>
                  <SquircleAvatar src={row.targetUser.profile_photo_url ?? undefined} alt={row.targetUser.display_name ?? undefined} size={44} />
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                    <span style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>{row.targetUser.display_name ?? 'Unknown'}</span>
                    <span style={{ color: t.inkMuted, fontSize: 12 }}>@{row.targetUser.username ?? '—'}</span>
                    <span style={{ color: t.inkFaint, fontSize: 11, marginTop: 2, fontFamily: 'monospace' }}>{row.targetUser.id}</span>
                  </div>
                </div>
              )}

              {row.kind === 'post' && row.targetPost && (
                <div style={{ padding: 12, border: `1px solid ${t.line}`, borderRadius: t.radius.md, background: t.canvas, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <SquircleAvatar src={row.targetPost.author?.profile_photo_url ?? undefined} alt={row.targetPost.author?.display_name ?? undefined} size={32} />
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                      <span style={{ color: t.ink, fontWeight: 700, fontSize: 13 }}>
                        {row.targetPost.author?.display_name ?? 'Unknown author'}
                      </span>
                      <span style={{ color: t.inkFaint, fontSize: 11 }}>{relTime(row.targetPost.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ color: t.ink, fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                    {row.targetPost.content?.trim() || <em style={{ color: t.inkFaint }}>(no text content)</em>}
                  </div>
                  <div style={{ color: t.inkFaint, fontSize: 11, fontFamily: 'monospace' }}>{row.targetPost.id}</div>
                </div>
              )}
            </section>

            {/* Reports */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.inkFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                Reports ({row.report_count})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {row.reports.map((r) => {
                  const details = 'details' in r.raw ? (r.raw as any).details : null;
                  return (
                    <div key={r.raw.id} style={{ padding: 12, border: `1px solid ${t.line}`, borderRadius: t.radius.md, background: t.surface }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <SquircleAvatar src={r.reporter?.profile_photo_url ?? undefined} alt={r.reporter?.display_name ?? undefined} size={24} />
                          <span style={{ color: t.ink, fontSize: 13, fontWeight: 600 }}>
                            {r.reporter?.display_name ?? 'Unknown reporter'}
                          </span>
                          <span style={{ color: t.inkFaint, fontSize: 11 }}>{relTime(r.raw.created_at)}</span>
                        </div>
                        <StatusPill tone={statusTone(r.raw.status)}>{r.raw.status}</StatusPill>
                      </div>
                      <div style={{ marginTop: 8, color: t.ink, fontSize: 13, fontWeight: 600 }}>{r.raw.reason}</div>
                      {details && (
                        <div style={{ marginTop: 4, color: t.inkMuted, fontSize: 13, lineHeight: 1.45 }}>{details}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </DetailDrawer>

      {dismissOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !dismiss.isPending && setDismissOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.surface,
              borderRadius: t.radius.lg,
              boxShadow: t.shadowPop,
              width: '100%', maxWidth: 440,
              padding: 20,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.ink }}>Dismiss reports</div>
              <div style={{ fontSize: 13, color: t.inkMuted, marginTop: 6, lineHeight: 1.45 }}>
                Mark these reports as dismissed with no violation. You can add an optional internal note.
              </div>
            </div>
            <textarea
              autoFocus
              placeholder="Optional resolution note (internal)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: t.radius.md,
                border: `1px solid ${t.line}`,
                background: t.canvas,
                color: t.ink,
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDismissOpen(false)}
                disabled={dismiss.isPending}
                style={{
                  padding: '8px 14px',
                  borderRadius: t.radius.md,
                  border: `1px solid ${t.line}`,
                  background: t.surface,
                  color: t.ink,
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={onDismissConfirm}
                disabled={dismiss.isPending}
                style={{
                  padding: '8px 14px',
                  borderRadius: t.radius.md,
                  border: 'none',
                  background: t.ink,
                  color: t.surface,
                  fontSize: 13, fontWeight: 600,
                  cursor: dismiss.isPending ? 'not-allowed' : 'pointer',
                  opacity: dismiss.isPending ? 0.55 : 1,
                }}
              >
                {dismiss.isPending ? 'Working...' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
