import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import DetailDrawer from './DetailDrawer';
import StatusPill from './StatusPill';
import type { AppealRow } from '../hooks/useAppeals';
import { useAppealActions } from '../hooks/useAppeals';

interface Props {
  open: boolean;
  onClose: () => void;
  row: AppealRow | null;
}

function relTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return '-'; }
}

function fmt(iso: string | null): string {
  if (!iso) return '-';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

type Mode = null | 'uphold' | 'overturn';

export default function AppealDetailDrawer({ open, onClose, row }: Props) {
  const { uphold, overturn } = useAppealActions();
  const [mode, setMode] = useState<Mode>(null);
  const [note, setNote] = useState('');

  const isPending = row?.status === 'pending';
  const busy = uphold.isPending || overturn.isPending;

  const appellantName =
    row?.appellant?.display_name || row?.appellant?.username || row?.user_id || 'Unknown';

  const suspensionSummary = useMemo(() => {
    if (!row?.appellant) return '-';
    const until = row.appellant.suspended_until;
    if (row.appellant.is_suspended && !until) return 'Suspended indefinitely';
    if (until) return `Suspended until ${fmt(until)}`;
    return 'No active suspension';
  }, [row]);

  const closeAll = () => { setMode(null); setNote(''); onClose(); };

  const submit = () => {
    if (!row || !mode) return;
    if (!note.trim()) return;
    const payload = { appealId: row.id, note };
    const opts = { onSuccess: () => closeAll() };
    if (mode === 'uphold') uphold.mutate(payload, opts);
    else overturn.mutate(payload, opts);
  };

  return (
    <>
      <DetailDrawer
        open={open}
        onClose={closeAll}
        title="Suspension appeal"
        subtitle={row ? `Submitted ${relTime(row.created_at)}` : ''}
        footer={
          row && isPending ? (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setMode('uphold'); setNote(''); }} disabled={busy} style={btnGhost()}>
                Uphold
              </button>
              <button onClick={() => { setMode('overturn'); setNote(''); }} disabled={busy} style={btnPrimary(busy)}>
                Overturn and reinstate
              </button>
            </div>
          ) : null
        }
      >
        {row && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <StatusPill tone={row.status === 'pending' ? 'warn' : row.status === 'overturned' ? 'ok' : 'neutral'}>
              {row.status}
            </StatusPill>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={sectionLabel()}>Appellant</div>
              <div style={cardStyle()}>
                <SquircleAvatar
                  src={row.appellant?.profile_photo_url ?? undefined}
                  alt={row.appellant?.display_name ?? undefined}
                  userId={row.user_id ?? null}
                  size={40}
                  hairlineRing
                />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
                  <span style={{ color: t.ink, fontWeight: 700, fontSize: 14 }}>{appellantName}</span>
                  {row.appellant?.username && (
                    <span style={{ color: t.inkMuted, fontSize: 12 }}>@{row.appellant.username}</span>
                  )}
                </div>
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={sectionLabel()}>Current suspension</div>
              <div style={{ ...cardStyle(), display: 'block', fontSize: 13, color: t.ink, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600 }}>{suspensionSummary}</div>
                {row.appellant?.suspension_reason && (
                  <div style={{ marginTop: 6, color: t.inkMuted, whiteSpace: 'pre-wrap' }}>
                    {row.appellant.suspension_reason}
                  </div>
                )}
                {row.suspension_ref && (
                  <div style={{ marginTop: 6, color: t.inkFaint, fontSize: 11 }}>
                    Ref: {fmt(row.suspension_ref)}
                  </div>
                )}
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={sectionLabel()}>Appeal message</div>
              <div style={{ ...cardStyle(), display: 'block', whiteSpace: 'pre-wrap', fontSize: 13, color: t.ink, lineHeight: 1.55 }}>
                {row.message}
              </div>
            </section>

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

      {mode && (
        <div
          role="dialog" aria-modal="true"
          onClick={() => !busy && setMode(null)}
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
              <div style={{ fontSize: 16, fontWeight: 700, color: t.ink }}>
                {mode === 'uphold' ? 'Uphold suspension' : 'Overturn and reinstate'}
              </div>
              <div style={{ fontSize: 13, color: t.inkMuted, marginTop: 6, lineHeight: 1.45 }}>
                {mode === 'uphold'
                  ? 'The suspension stays in place. The user will be notified with your note.'
                  : 'This lifts the suspension immediately and reinstates the account. The user will be notified.'}
              </div>
            </div>
            <textarea
              autoFocus
              placeholder="Short reason (visible to the user)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={textareaStyle()}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setMode(null)} disabled={busy} style={btnGhost()}>Cancel</button>
              <button onClick={submit} disabled={busy || !note.trim()} style={btnPrimary(busy)}>
                {busy ? 'Working...' : mode === 'uphold' ? 'Uphold' : 'Overturn'}
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
function btnPrimary(busy = false): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: t.radius.md,
    border: 'none', background: t.brand, color: t.canvas,
    fontSize: 13, fontWeight: 700,
    cursor: busy ? 'not-allowed' : 'pointer',
    opacity: busy ? 0.55 : 1,
  };
}
