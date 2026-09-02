import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import DetailDrawer from './DetailDrawer';
import StatusPill from './StatusPill';
import type { AdminRequestRow } from '../hooks/useAdminActionRequests';
import { useAdminActionRequestActions } from '../hooks/useAdminActionRequests';

interface Props {
  open: boolean;
  onClose: () => void;
  row: AdminRequestRow | null;
}

function relTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return '-'; }
}

const ACTION_LABEL: Record<string, string> = {
  permanent_ban: 'Permanent ban',
  delete_user: 'Delete user',
  role_change: 'Role change',
};

export default function ApprovalDetailDrawer({ open, onClose, row }: Props) {
  const { approve, reject } = useAdminActionRequestActions();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');

  const payload = (row?.payload ?? {}) as Record<string, any>;
  const isPending = row?.status === 'pending';

  const targetName =
    row?.target?.display_name || row?.target?.username || row?.target_email || row?.target_user_id || 'Unknown target';

  const requesterName =
    row?.requester?.display_name || row?.requester?.username || row?.requested_by || 'Unknown';

  const summary = useMemo(() => {
    if (!row) return '';
    if (row.action_type === 'role_change') return `roleAction: ${payload.roleAction ?? '?'}`;
    if (row.action_type === 'permanent_ban') return payload.reason ?? '(no reason provided)';
    if (row.action_type === 'delete_user') return payload.reason ?? '(no reason provided)';
    return '';
  }, [row, payload]);

  const closeAll = () => { setRejectOpen(false); setNote(''); onClose(); };

  const onApprove = () => {
    if (!row) return;
    approve.mutate({ requestId: row.id }, { onSuccess: () => closeAll() });
  };
  const onReject = () => {
    if (!row) return;
    reject.mutate({ requestId: row.id, note }, { onSuccess: () => closeAll() });
  };

  return (
    <>
      <DetailDrawer
        open={open}
        onClose={closeAll}
        title={row ? ACTION_LABEL[row.action_type] ?? row.action_type : 'Request'}
        subtitle={row ? `Requested ${relTime(row.created_at)}` : ''}
        footer={
          row && isPending ? (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectOpen(true)} disabled={reject.isPending || approve.isPending} style={btnGhost()}>
                Reject
              </button>
              <button
                onClick={onApprove}
                disabled={approve.isPending || reject.isPending}
                style={btnDanger(approve.isPending)}
              >
                {approve.isPending ? 'Working...' : 'Approve & execute'}
              </button>
            </div>
          ) : null
        }
      >
        {row && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <StatusPill tone={row.status === 'pending' ? 'warn' : row.status === 'approved' ? 'ok' : 'neutral'}>
              {row.status}
            </StatusPill>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={sectionLabel()}>Target</div>
              <div style={cardStyle()}>
                <SquircleAvatar
                  src={row.target?.profile_photo_url ?? undefined}
                  alt={row.target?.display_name ?? undefined}
                  userId={row.target_user_id ?? null}
                  size={40}
                  hairlineRing
                />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
                  <span style={{ color: t.ink, fontWeight: 700, fontSize: 14 }}>{targetName}</span>
                  {row.target?.username && (
                    <span style={{ color: t.inkMuted, fontSize: 12 }}>@{row.target.username}</span>
                  )}
                  {row.target_user_id && (
                    <span style={{ color: t.inkFaint, fontSize: 11, fontFamily: 'monospace' }}>{row.target_user_id}</span>
                  )}
                </div>
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={sectionLabel()}>Requester</div>
              <div style={cardStyle()}>
                <SquircleAvatar
                  src={row.requester?.profile_photo_url ?? undefined}
                  alt={row.requester?.display_name ?? undefined}
                  userId={row.requested_by ?? null}
                  size={32}
                  hairlineRing
                />
                <span style={{ color: t.ink, fontSize: 13, fontWeight: 600 }}>{requesterName}</span>
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={sectionLabel()}>Reason / payload</div>
              <div style={{ ...cardStyle(), display: 'block', whiteSpace: 'pre-wrap', fontSize: 13, color: t.ink, lineHeight: 1.5 }}>
                {summary}
                <pre style={{ marginTop: 8, color: t.inkFaint, fontSize: 11, whiteSpace: 'pre-wrap' }}>
{JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            </section>

            {row.related_report_id && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={sectionLabel()}>Related report</div>
                <span style={{ color: t.inkFaint, fontSize: 12, fontFamily: 'monospace' }}>{row.related_report_id}</span>
              </section>
            )}

            {row.reviewed_at && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={sectionLabel()}>Reviewed</div>
                <span style={{ color: t.inkMuted, fontSize: 13 }}>
                  {relTime(row.reviewed_at)} - {row.review_note ?? 'no note'}
                </span>
              </section>
            )}
          </div>
        )}
      </DetailDrawer>

      {rejectOpen && (
        <div
          role="dialog" aria-modal="true"
          onClick={() => !reject.isPending && setRejectOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.surface, borderRadius: t.radius.lg, boxShadow: t.shadowPop,
              width: '100%', maxWidth: 440, padding: 20,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.ink }}>Reject request</div>
              <div style={{ fontSize: 13, color: t.inkMuted, marginTop: 6, lineHeight: 1.45 }}>
                The requester will be notified. Add a short note explaining why.
              </div>
            </div>
            <textarea
              autoFocus
              placeholder="Reason (visible to the requester)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={textareaStyle()}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectOpen(false)} disabled={reject.isPending} style={btnGhost()}>Cancel</button>
              <button onClick={onReject} disabled={reject.isPending} style={btnDanger(reject.isPending)}>
                {reject.isPending ? 'Working...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function sectionLabel(): React.CSSProperties {
  return { fontSize: 11, fontWeight: 700, color: t.inkFaint, textTransform: 'uppercase', letterSpacing: 0.4 };
}
function cardStyle(): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: `1px solid ${t.line}`, borderRadius: t.radius.md, background: t.canvas };
}
function textareaStyle(): React.CSSProperties {
  return {
    width: '100%', padding: 10, borderRadius: t.radius.md,
    border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
    fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
  };
}
function btnGhost(): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: t.radius.md,
    border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  };
}
function btnDanger(busy = false): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: t.radius.md,
    border: 'none', background: t.dangerText, color: t.canvas,
    fontSize: 13, fontWeight: 700,
    cursor: busy ? 'not-allowed' : 'pointer',
    opacity: busy ? 0.55 : 1,
  };
}
