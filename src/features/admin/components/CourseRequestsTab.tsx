import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MapPin } from 'lucide-react';
import { adminTheme as t } from '../theme';
import StatusPill from './StatusPill';
import EmptyState from './EmptyState';
import { useCourseRequests, type CourseRequestRow, type CourseRequestStatus } from '../hooks/useCourseRequests';

const STATUS_TONE: Record<CourseRequestStatus, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  pending: 'warn',
  added: 'ok',
  rejected: 'neutral',
  duplicate: 'neutral',
};

const STATUS_LABEL: Record<CourseRequestStatus, string> = {
  pending: 'Pending',
  added: 'Added',
  rejected: 'Rejected',
  duplicate: 'Duplicate',
};

type Filter = 'all' | 'pending' | 'resolved';

export default function CourseRequestsTab() {
  const { data, isLoading, pendingCount, resolveCourseRequest } = useCourseRequests();
  const [filter, setFilter] = useState<Filter>('pending');

  const filtered = useMemo(() => {
    if (filter === 'pending') return data.filter(r => r.status === 'pending');
    if (filter === 'resolved') return data.filter(r => r.status !== 'pending');
    return data;
  }, [data, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['pending', 'all', 'resolved'] as Filter[]).map(f => {
          const active = filter === f;
          const count = f === 'pending' ? pendingCount : f === 'all' ? data.length : data.length - pendingCount;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px', borderRadius: 999,
                border: `1px solid ${active ? 'transparent' : t.line}`,
                background: active ? t.brandSoft : t.surface,
                color: active ? t.brandText : t.inkMuted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f} <span style={{ opacity: 0.7, marginLeft: 4 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 96, background: t.canvas, borderRadius: t.radius.md, animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No course requests yet."
          subtitle={filter !== 'all' ? `Switch filter to see ${filter === 'pending' ? 'resolved' : 'pending'} requests.` : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(row => (
            <RequestCard
              key={row.id}
              row={row}
              busy={resolveCourseRequest.isPending}
              onResolve={(status, adminNotes) => resolveCourseRequest.mutate({ id: row.id, status, adminNotes })}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes admin-pulse { 0%,100%{opacity:.55} 50%{opacity:1} }`}</style>
    </div>
  );
}

function RequestCard({
  row, busy, onResolve,
}: {
  row: CourseRequestRow;
  busy: boolean;
  onResolve: (status: CourseRequestStatus, adminNotes?: string | null) => void;
}) {
  const [note, setNote] = useState('');
  const isPending = row.status === 'pending';
  const submitted = (() => {
    try { return formatDistanceToNow(new Date(row.createdAt), { addSuffix: true }); }
    catch { return ''; }
  })();
  const resolved = row.resolvedAt ? (() => {
    try { return formatDistanceToNow(new Date(row.resolvedAt!), { addSuffix: true }); }
    catch { return ''; }
  })() : null;

  const initial = (row.displayName || row.username || '?').charAt(0).toUpperCase();

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: t.radius.md,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: t.ink, lineHeight: 1.3 }}>
            {row.courseName}
          </div>
          {(row.location || row.country) && (
            <div style={{ fontSize: 12, color: t.inkMuted, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={11} />
              {[row.location, row.country].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <StatusPill tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</StatusPill>
      </div>

      {row.note && (
        <div style={{
          fontSize: 13, color: t.inkMuted,
          background: t.canvas, borderRadius: t.radius.sm, padding: '8px 10px',
          lineHeight: 1.4,
        }}>
          {row.note}
        </div>
      )}

      {/* Requester + dates */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.inkMuted }}>
        <div style={{
          width: 24, height: 24, borderRadius: 8, overflow: 'hidden',
          background: t.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: t.inkFaint, flexShrink: 0,
        }}>
          {row.avatarUrl
            ? <img src={row.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initial}
        </div>
        <span style={{ color: t.ink, fontWeight: 600 }}>
          {row.displayName || row.username || 'Unknown user'}
        </span>
        {row.username && row.displayName && (
          <span style={{ color: t.inkFaint }}>@{row.username}</span>
        )}
        <span style={{ marginLeft: 'auto' }}>{submitted}</span>
      </div>

      {row.adminNotes && (
        <div style={{
          fontSize: 12, padding: '6px 10px',
          background: t.brandSoft, borderRadius: t.radius.sm,
          color: t.inkMuted,
        }}>
          <span style={{ color: t.brandText, fontWeight: 600 }}>Admin note:</span> {row.adminNotes}
        </div>
      )}

      {/* Actions */}
      {isPending ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional admin note…"
            style={{
              padding: '8px 10px', borderRadius: t.radius.sm,
              border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
              fontSize: 13, outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <ActionBtn
              tone="ok"
              disabled={busy}
              onClick={() => onResolve('added', note.trim() || null)}
            >Mark added</ActionBtn>
            <ActionBtn
              tone="neutral"
              disabled={busy}
              onClick={() => onResolve('duplicate', note.trim() || null)}
            >Duplicate</ActionBtn>
            <ActionBtn
              tone="danger"
              disabled={busy}
              onClick={() => onResolve('rejected', note.trim() || null)}
            >Reject</ActionBtn>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.inkMuted }}>
          <span>Resolved {resolved}</span>
          <button
            onClick={() => onResolve('pending', null)}
            disabled={busy}
            style={{
              marginLeft: 'auto',
              padding: '4px 10px', borderRadius: t.radius.sm,
              border: `1px solid ${t.line}`, background: t.surface, color: t.inkMuted,
              fontSize: 11, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >Reopen</button>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  tone, children, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone: 'ok' | 'danger' | 'neutral' }) {
  const TONE = {
    ok:      { bg: t.ok,      fg: '#FFFFFF' },
    danger:  { bg: t.surface, fg: t.danger, border: t.line },
    neutral: { bg: t.surface, fg: t.inkMuted, border: t.line },
  } as const;
  const c = TONE[tone];
  return (
    <button
      {...rest}
      style={{
        padding: '8px 14px', borderRadius: t.radius.md,
        border: `1px solid ${('border' in c ? c.border : 'transparent')}`,
        background: c.bg, color: c.fg,
        fontSize: 13, fontWeight: 600,
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        opacity: rest.disabled ? 0.6 : 1,
      }}
    >{children}</button>
  );
}
