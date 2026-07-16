import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Inbox } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../theme';
import SectionTabs from '../components/SectionTabs';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';
import AdminAccessDenied from '../components/AdminAccessDenied';
import AdminErrorState from '../components/AdminErrorState';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';

type RequestStatus = 'pending' | 'matched' | 'rejected';

interface MatchRequestRow {
  id: string;
  user_id: string;
  golf_course_id: string;
  whs_course_name: string | null;
  status: RequestStatus;
  created_at: string;
  resolved_at: string | null;
  course_name: string | null;
  requester_name: string | null;
  requester_username: string | null;
}

const QUERY_KEY = ['admin-match-requests'] as const;

function relTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '-';
  }
}

function statusTone(s: RequestStatus) {
  if (s === 'pending') return 'warn' as const;
  if (s === 'matched') return 'ok' as const;
  return 'danger' as const;
}

async function fetchMatchRequests(status: RequestStatus): Promise<MatchRequestRow[]> {
  const { data, error } = await supabase
    .from('whs_course_match_requests')
    .select(
      `
      id, user_id, golf_course_id, whs_course_name, status, created_at, resolved_at,
      golf_courses:golf_course_id ( name ),
      user_profiles:user_id ( display_name, username )
    `,
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    golf_course_id: r.golf_course_id,
    whs_course_name: r.whs_course_name,
    status: r.status as RequestStatus,
    created_at: r.created_at,
    resolved_at: r.resolved_at,
    course_name: r.golf_courses?.name ?? null,
    requester_name: r.user_profiles?.display_name ?? null,
    requester_username: r.user_profiles?.username ?? null,
  }));
}

export default function MatchRequestsPage() {
  const { role } = usePanelRole();
  const caps = panelCan(role);
  const [params, setParams] = useSearchParams();
  const status = ((params.get('status') as RequestStatus) || 'pending') as RequestStatus;

  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEY, status],
    queryFn: () => fetchMatchRequests(status),
  });

  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: QUERY_KEY });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);

  const tabs = useMemo(
    () => [
      { id: 'pending', label: 'Pending' },
      { id: 'matched', label: 'Matched' },
      { id: 'rejected', label: 'Rejected' },
    ],
    [],
  );

  const setStatus = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('status', id);
    setParams(next, { replace: true });
  };

  if (!caps.viewUsers) return <AdminAccessDenied />;

  const emptyCopy: Record<RequestStatus, string> = {
    pending: 'No pending match requests right now.',
    matched: 'No requests have been matched yet.',
    rejected: 'No requests have been rejected.',
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180, margin: '0 auto' }}>
      <SectionTabs tabs={tabs} activeId={status} onChange={setStatus} />

      {isLoading ? (
        <div style={{ color: t.inkMuted, fontSize: 13, padding: 24 }}>Loading requests...</div>
      ) : data.length === 0 ? (
        <EmptyState icon={<Inbox size={28} />} title="No requests" subtitle={emptyCopy[status]} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((row) => (
            <RequestRow key={row.id} row={row} onRefresh={() => qc.invalidateQueries({ queryKey: QUERY_KEY })} />
          ))}
        </div>
      )}
    </div>
  );
}

interface RequestRowProps {
  row: MatchRequestRow;
  onRefresh: () => void;
}

function RequestRow({ row, onRefresh }: RequestRowProps) {
  const [confirming, setConfirming] = useState(false);
  const [whsInput, setWhsInput] = useState(row.whs_course_name ?? '');
  const [busy, setBusy] = useState(false);
  const [errText, setErrText] = useState<string | null>(null);

  const requesterLabel =
    row.requester_name ?? (row.requester_username ? `@${row.requester_username}` : row.user_id.slice(0, 8));

  const doMatch = async () => {
    const val = whsInput.trim();
    if (!val) {
      setErrText('WHS name is required.');
      return;
    }
    setBusy(true);
    setErrText(null);

    const { data, error } = await supabase.functions.invoke('admin-resolve-match-request', {
      body: { request_id: row.id, action: 'match', whs_name: val },
    });

    setBusy(false);
    const errMsg = (error as any)?.message || (data as any)?.error;
    if (errMsg) {
      setErrText(String(errMsg));
      return;
    }
    setConfirming(false);
    onRefresh();
  };

  const doReject = async () => {
    setBusy(true);
    setErrText(null);
    const { data, error } = await supabase.functions.invoke('admin-resolve-match-request', {
      body: { request_id: row.id, action: 'reject' },
    });
    setBusy(false);
    const errMsg = (error as any)?.message || (data as any)?.error;
    if (errMsg) {
      setErrText(`Reject failed: ${String(errMsg)}`);
      return;
    }
    onRefresh();
  };

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg,
        padding: 14,
        boxShadow: t.shadowCard,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700, color: t.ink, fontSize: 14 }}>
          {row.course_name ?? row.golf_course_id.slice(0, 8)}
        </span>
        <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
      </div>

      <div style={{ color: t.inkMuted, fontSize: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span>Requester: <span style={{ color: t.ink, fontWeight: 600 }}>{requesterLabel}</span></span>
        <span>-</span>
        <span>{relTime(row.created_at)}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ color: t.inkFaint, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Their WHS name
        </span>
        <code
          style={{
            display: 'block',
            padding: '10px 12px',
            borderRadius: t.radius.md,
            border: `1px solid ${t.line}`,
            background: t.neutralSoft,
            color: t.ink,
            fontSize: 13,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {row.whs_course_name ?? '(none supplied)'}
        </code>
      </div>

      {row.status === 'pending' && (
        <>
          {!confirming ? (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={doReject}
                disabled={busy}
                style={{
                  padding: '8px 14px',
                  borderRadius: t.radius.md,
                  border: `1px solid ${t.line}`,
                  background: t.surface,
                  color: t.dangerText,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: busy ? 'default' : 'pointer',
                }}
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={busy}
                style={{
                  padding: '8px 14px',
                  borderRadius: t.radius.md,
                  border: 'none',
                  background: t.brand,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Match
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ color: t.inkMuted, fontSize: 12 }}>
                Confirm the WHS name to alias (required):
              </label>
              <input
                type="text"
                value={whsInput}
                onChange={(e) => setWhsInput(e.target.value)}
                placeholder="WHS course name"
                style={{
                  padding: '10px 12px',
                  borderRadius: t.radius.md,
                  border: `1px solid ${t.line}`,
                  background: t.surface,
                  color: t.ink,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false);
                    setErrText(null);
                    setWhsInput(row.whs_course_name ?? '');
                  }}
                  disabled={busy}
                  style={{
                    padding: '8px 14px',
                    borderRadius: t.radius.md,
                    border: `1px solid ${t.line}`,
                    background: t.surface,
                    color: t.ink,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: busy ? 'default' : 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={doMatch}
                  disabled={busy || !whsInput.trim()}
                  style={{
                    padding: '8px 14px',
                    borderRadius: t.radius.md,
                    border: 'none',
                    background: t.ok,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: busy || !whsInput.trim() ? 'default' : 'pointer',
                    opacity: busy || !whsInput.trim() ? 0.6 : 1,
                  }}
                >
                  {busy ? 'Working...' : 'Confirm match'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {errText && (
        <div
          style={{
            padding: '8px 10px',
            borderRadius: t.radius.md,
            background: t.dangerSoft,
            color: t.dangerText,
            fontSize: 12,
            lineHeight: 1.4,
          }}
        >
          {errText}
        </div>
      )}
    </div>
  );
}
