import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import DetailDrawer from './DetailDrawer';
import StatusPill from './StatusPill';
import { useModerationActions } from '../hooks/useModerationActions';
import { useCreateAdminActionRequest } from '../hooks/useAdminActionRequests';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import type { ModerationQueueRow, ReportStatus } from '../hooks/useModerationQueue';
import { stripMentionMarkup } from '@/lib/mentions/format';

interface Props {
  open: boolean;
  onClose: () => void;
  row: ModerationQueueRow | null;
}

type EnforceMode = null | 'warn' | 'suspend' | 'hide';

const DURATION_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: '24h', value: 1 },
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: 'Permanent', value: null },
];

function relTime(iso: string | null | undefined) {
  if (!iso) return '-';
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return '-'; }
}

function statusTone(s: ReportStatus) {
  if (s === 'pending') return 'warn' as const;
  if (s === 'reviewing') return 'neutral' as const;
  if (s === 'actioned') return 'ok' as const;
  return 'neutral' as const;
}

export default function ModerationDetailDrawer({ open, onClose, row }: Props) {
  const {
    setReviewingBulk, dismiss,
    warnUser, suspendUser, hidePost, unhidePost, keepHiddenActioned,
  } = useModerationActions();
  const createRequest = useCreateAdminActionRequest();
  const { role } = usePanelRole();
  const caps = panelCan(role);
  const canPermanent = caps.permanentBanDirect;
  const isLimited = role === 'limited';

  const [dismissOpen, setDismissOpen] = useState(false);
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<EnforceMode>(null);
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState<number | null>(7);

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

  const resetEnforce = () => {
    setMode(null);
    setMessage('');
    setDuration(7);
  };

  const closeAll = () => {
    resetEnforce();
    onClose();
  };

  const onStartReviewing = () => {
    if (!row || !kind) return;
    setReviewingBulk.mutate({ kind, ids }, { onSuccess: () => closeAll() });
  };

  const onDismissConfirm = () => {
    if (!row || !kind) return;
    dismiss.mutate(
      { kind, ids, note },
      {
        onSuccess: () => {
          setDismissOpen(false);
          setNote('');
          closeAll();
        },
      },
    );
  };

  const submitEnforce = () => {
    if (!row || !kind) return;

    if (mode === 'warn') {
      const targetUserId =
        row.kind === 'user' ? row.targetUser?.id : row.targetPost?.user_id;
      if (!targetUserId) return;
      const text = message.trim() || 'Please review the community guidelines.';
      warnUser.mutate(
        { userId: targetUserId, message: text, relatedKind: kind, relatedIds: ids },
        { onSuccess: () => closeAll() },
      );
    } else if (mode === 'suspend') {
      const targetUserId =
        row.kind === 'user' ? row.targetUser?.id : row.targetPost?.user_id;
      if (!targetUserId) return;
      const text = message.trim();
      if (!text) return;

      // Limited admins requesting permanent -> create an approval request.
      if (duration === null && isLimited) {
        createRequest.mutate(
          {
            action_type: 'permanent_ban',
            target_user_id: targetUserId,
            payload: { reason: text },
            related_report_id: ids[0] ?? null,
          },
          { onSuccess: () => closeAll() },
        );
        return;
      }

      if (duration === null && !canPermanent) return;
      suspendUser.mutate(
        {
          userId: targetUserId,
          durationDays: duration,
          reason: text,
          relatedKind: kind,
          relatedIds: ids,
        },
        { onSuccess: () => closeAll() },
      );
    } else if (mode === 'hide') {
      if (row.kind !== 'post' || !row.targetPost?.id) return;
      const text = message.trim() || 'Violation of community guidelines';
      hidePost.mutate(
        { postId: row.targetPost.id, reason: text, relatedKind: kind, relatedIds: ids },
        { onSuccess: () => closeAll() },
      );
    }
  };

  const enforceBusy =
    warnUser.isPending || suspendUser.isPending || hidePost.isPending || createRequest.isPending;

  const canEnforce = caps.actModeration;
  const showFooter = row && row.status !== 'dismissed' && row.status !== 'actioned';

  return (
    <>
      <DetailDrawer
        open={open}
        onClose={closeAll}
        title={targetTitle}
        subtitle={subtitle}
        footer={
          showFooter ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {canEnforce && mode === null && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setMode('warn')} style={btnGhost()}>Warn</button>
                  <button onClick={() => setMode('suspend')} style={btnGhost()}>Suspend</button>
                  {row?.kind === 'post' && (
                    <button onClick={() => setMode('hide')} style={btnGhost()}>Hide post</button>
                  )}
                </div>
              )}

              {canEnforce && mode !== null && (
                <EnforcePanel
                  mode={mode}
                  message={message}
                  setMessage={setMessage}
                  duration={duration}
                  setDuration={setDuration}
                  canPermanent={canPermanent}
                  isLimited={isLimited}
                  onCancel={resetEnforce}
                  onSubmit={submitEnforce}
                  busy={enforceBusy}
                />
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDismissOpen(true)}
                  disabled={dismiss.isPending}
                  style={btnGhost()}
                >
                  Dismiss (no violation)
                </button>
                {row?.status === 'pending' && (
                  <button
                    onClick={onStartReviewing}
                    disabled={setReviewingBulk.isPending}
                    style={btnPrimary()}
                  >
                    Start reviewing
                  </button>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {row && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
              {row.is_high_priority && (
                <StatusPill tone="danger">High priority</StatusPill>
              )}
              {row.auto_hidden && (
                <StatusPill tone="warn">Auto-hidden</StatusPill>
              )}
            </div>

            {row.kind === 'post' && row.auto_hidden && row.targetPost && (
              <div
                style={{
                  border: `1px solid ${t.warnText}`,
                  background: t.warnSoft,
                  color: t.warnText,
                  borderRadius: t.radius.md,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  Automatically hidden after {row.report_count} report{row.report_count === 1 ? '' : 's'}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.45, color: t.ink }}>
                  This post is already hidden from feeds pending review. Confirm the hide or restore it.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      if (!row.targetPost?.id) return;
                      unhidePost.mutate(
                        { postId: row.targetPost.id },
                        {
                          onSuccess: () => {
                            dismiss.mutate(
                              { kind: 'post', ids, note: 'Auto-hide reverted; no violation' },
                              { onSuccess: () => closeAll() },
                            );
                          },
                        },
                      );
                    }}
                    disabled={unhidePost.isPending || dismiss.isPending}
                    style={btnGhost()}
                  >
                    Restore post
                  </button>
                  <button
                    onClick={() => {
                      keepHiddenActioned.mutate(
                        { kind: 'post', ids, note: 'Auto-hide confirmed by moderator' },
                        { onSuccess: () => closeAll() },
                      );
                    }}
                    disabled={keepHiddenActioned.isPending}
                    style={btnPrimary(keepHiddenActioned.isPending)}
                  >
                    Keep hidden
                  </button>
                </div>
              </div>
            )}


            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={sectionLabel()}>
                {row.kind === 'user' ? 'Reported user' : 'Reported post'}
              </div>

              {row.kind === 'user' && row.targetUser && (
                <div style={cardStyle()}>
                  <SquircleAvatar src={row.targetUser.profile_photo_url ?? undefined} alt={row.targetUser.display_name ?? undefined} userId={row.targetUser.id} size={44}
                    hairlineRing
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                    <span style={{ color: t.ink, fontWeight: 700, fontSize: 15 }}>{row.targetUser.display_name ?? 'Unknown'}</span>
                    <span style={{ color: t.inkMuted, fontSize: 12 }}>@{row.targetUser.username ?? '-'}</span>
                    <span style={{ color: t.inkFaint, fontSize: 11, marginTop: 2, fontFamily: 'monospace' }}>{row.targetUser.id}</span>
                  </div>
                </div>
              )}

              {row.kind === 'post' && row.targetPost && (
                <div style={{ ...cardStyle(), flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <SquircleAvatar src={row.targetPost.author?.profile_photo_url ?? undefined} alt={row.targetPost.author?.display_name ?? undefined} userId={row.targetPost.author?.id ?? null} size={32}
                      hairlineRing
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                      <span style={{ color: t.ink, fontWeight: 700, fontSize: 13 }}>
                        {row.targetPost.author?.display_name ?? 'Unknown author'}
                      </span>
                      <span style={{ color: t.inkFaint, fontSize: 11 }}>{relTime(row.targetPost.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ color: t.ink, fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                    {stripMentionMarkup(row.targetPost.content ?? '').trim() || <em style={{ color: t.inkFaint }}>(no text content)</em>}
                  </div>
                  <div style={{ color: t.inkFaint, fontSize: 11, fontFamily: 'monospace' }}>{row.targetPost.id}</div>
                </div>
              )}
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={sectionLabel()}>Reports ({row.report_count})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {row.reports.map((r) => {
                  const details = 'details' in r.raw ? (r.raw as any).details : null;
                  return (
                    <div key={r.raw.id} style={{ padding: 12, border: `1px solid ${t.line}`, borderRadius: t.radius.md, background: t.surface }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <SquircleAvatar src={r.reporter?.profile_photo_url ?? undefined} alt={r.reporter?.display_name ?? undefined} userId={r.reporter?.id ?? null} size={24}
                            hairlineRing
                          />
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
            background: 'rgba(0,0,0,0.6)',
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
              style={textareaStyle()}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDismissOpen(false)} disabled={dismiss.isPending} style={btnGhost()}>Cancel</button>
              <button onClick={onDismissConfirm} disabled={dismiss.isPending} style={btnPrimary(dismiss.isPending)}>
                {dismiss.isPending ? 'Working...' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EnforcePanel({
  mode, message, setMessage, duration, setDuration,
  canPermanent, isLimited, onCancel, onSubmit, busy,
}: {
  mode: Exclude<EnforceMode, null>;
  message: string;
  setMessage: (v: string) => void;
  duration: number | null;
  setDuration: (v: number | null) => void;
  canPermanent: boolean;
  isLimited: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const isPermanentSelected = mode === 'suspend' && duration === null;
  const willRequest = isPermanentSelected && isLimited;

  const title =
    mode === 'warn' ? 'Send a warning'
    : mode === 'suspend' ? (willRequest ? 'Request permanent ban' : 'Suspend account')
    : 'Hide post';

  const placeholder =
    mode === 'warn' ? 'Warning message (visible to the user)'
    : mode === 'suspend' ? 'Suspension reason (visible to the user)'
    : 'Reason for hiding (internal)';

  const submitDisabled =
    busy
    || (mode === 'suspend' && !message.trim())
    || (isPermanentSelected && !canPermanent && !isLimited);

  const submitLabel =
    busy ? 'Working...'
    : mode === 'warn' ? 'Send warning'
    : mode === 'suspend' ? (willRequest ? 'Request permanent ban' : (isPermanentSelected ? 'Permanent ban' : 'Suspend'))
    : 'Hide post';

  return (
    <div style={{
      border: `1px solid ${t.line}`, borderRadius: t.radius.md,
      background: t.canvas, padding: 12,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>{title}</div>

      {mode === 'suspend' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DURATION_OPTIONS.map((opt) => {
            const isPermanent = opt.value === null;
            // Limited admins can select Permanent; it routes to a request.
            const disabled = isPermanent && !canPermanent && !isLimited;
            const selected = duration === opt.value;
            return (
              <button
                key={opt.label}
                title={isPermanent && isLimited ? 'Full-admin approval required' : (disabled ? 'Full admin only' : undefined)}
                disabled={disabled}
                onClick={() => setDuration(opt.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: t.radius.md,
                  border: `1px solid ${selected ? t.ink : t.line}`,
                  background: selected ? t.ink : t.surface,
                  color: selected ? t.surface : (disabled ? t.inkFaint : t.ink),
                  fontSize: 12, fontWeight: 600,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.55 : 1,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {willRequest && (
        <div style={{ fontSize: 12, color: t.inkMuted, lineHeight: 1.5 }}>
          This will submit a request for a Full admin to review and execute.
        </div>
      )}

      <textarea
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        style={textareaStyle()}
      />

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} disabled={busy} style={btnGhost()}>Cancel</button>
        <button onClick={onSubmit} disabled={submitDisabled} style={btnPrimary(submitDisabled)}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

// ---- inline style helpers ----
function sectionLabel(): React.CSSProperties {
  return {
    fontSize: 11, fontWeight: 700, color: t.inkFaint,
    textTransform: 'uppercase', letterSpacing: 0.4,
  };
}
function cardStyle(): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 12, padding: 12,
    border: `1px solid ${t.line}`, borderRadius: t.radius.md, background: t.canvas,
  };
}
function textareaStyle(): React.CSSProperties {
  return {
    width: '100%', padding: 10,
    borderRadius: t.radius.md,
    border: `1px solid ${t.line}`,
    background: t.surface, color: t.ink,
    fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
  };
}
function btnGhost(): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: t.radius.md,
    border: `1px solid ${t.line}`, background: t.surface,
    color: t.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  };
}
function btnPrimary(disabled = false): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: t.radius.md,
    border: 'none', background: t.ink, color: t.surface,
    fontSize: 13, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
  };
}
