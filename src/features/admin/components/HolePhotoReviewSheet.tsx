/**
 * H4 - hole photo review surface.
 *
 * Reuses the AdminSheet pattern used by the other Inbox detail sheets
 * (VerificationInboxSheet / UnmatchedCourseSheet) rather than the older
 * DetailDrawer, so it behaves as a bottom sheet on mobile.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminTheme as t } from '../theme';
import AdminSheet from './AdminSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  HOLE_PHOTO_REJECT_REASONS,
  
  approveHolePhoto,
  fetchLiveHolePhoto,
  fetchProofRound,
  holePhotoReasonLabel,
  rejectHolePhoto,
  removeLiveHolePhoto,
  type HolePhotoQueueRow,
  type HolePhotoRejectReason,
} from '../hooks/useHolePhotoQueue';

const btnGhost = (): React.CSSProperties => ({
  padding: '8px 14px',
  borderRadius: t.radius.md,
  border: `1px solid ${t.line}`,
  background: t.surface,
  color: t.ink,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
});

const btnPrimary = (busy: boolean): React.CSSProperties => ({
  padding: '8px 14px',
  borderRadius: t.radius.md,
  border: 'none',
  background: t.ink,
  color: t.surface,
  fontSize: 13,
  fontWeight: 600,
  cursor: busy ? 'not-allowed' : 'pointer',
  opacity: busy ? 0.6 : 1,
});

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  color: t.inkMuted,
};

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: `1px solid ${t.line}` }}>
      <span style={{ fontSize: 12, color: t.inkMuted }}>{k}</span>
      <span style={{ fontSize: 13, color: t.ink, fontWeight: 600, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

interface Props {
  row: HolePhotoQueueRow | null;
  onClose: () => void;
}

export default function HolePhotoReviewSheet({ row, onClose }: Props) {
  const qc = useQueryClient();
  const [reason, setReason] = useState<HolePhotoRejectReason | ''>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!row) { setReason(''); setNote(''); setErr(null); setBusy(false); }
  }, [row]);

  const live = useQuery({
    queryKey: ['admin-v2', 'inbox', 'hole-photo-live', row?.course_id, row?.hole_no],
    queryFn: () => fetchLiveHolePhoto(row!.course_id, row!.hole_no),
    enabled: !!row,
    staleTime: 10_000,
  });

  const proof = useQuery({
    queryKey: ['admin-v2', 'inbox', 'hole-photo-proof', row?.proof_score_id, row?.hole_no],
    queryFn: () => fetchProofRound(row!.proof_score_id, row!.hole_no),
    enabled: !!row,
    staleTime: 60_000,
  });

  const hasAuto = useMemo(
    () => !!row && (row.auto_verdict != null || row.auto_confidence != null || (row.auto_notes ?? '').trim().length > 0),
    [row],
  );

  if (!row) return null;

  const isPending = row.status === 'pending';
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-v2', 'inbox'] });
    qc.invalidateQueries({ queryKey: ['admin-v2', 'dashboard', 'triage-counts'] });
    qc.invalidateQueries({ queryKey: ['hole-photo'] });
  };

  const onApprove = async () => {
    setBusy(true); setErr(null);
    try {
      await approveHolePhoto(row);
      // callsite: hole_photo_approved
      analyticsEvents.track('hole_photo_approved', {
        media_id: row.id, course_id: row.course_id, hole_no: row.hole_no,
      });
      toast.success('Photo approved');
      refresh();
      onClose();
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Could not approve the photo';
      setErr(msg);
      toast.error(msg);

    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    if (!reason) { setErr('Pick a reason first'); return; }
    setBusy(true); setErr(null);
    try {
      await rejectHolePhoto(row, reason, note);
      // callsite: hole_photo_rejected
      analyticsEvents.track('hole_photo_rejected', {
        media_id: row.id, course_id: row.course_id, hole_no: row.hole_no, reason,
      });
      toast.success('Photo rejected');
      refresh();
      onClose();
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Could not reject the photo';
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const onRemoveLive = async () => {
    const liveRow = live.data;
    if (!liveRow) return;
    setBusy(true); setErr(null);
    try {
      await removeLiveHolePhoto(liveRow);
      // callsite: hole_photo_replaced
      analyticsEvents.track('hole_photo_replaced', {
        removed_media_id: liveRow.id, course_id: row.course_id, hole_no: row.hole_no,
      });
      toast.success('Removed from the hole');
      await live.refetch();
      refresh();
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Could not remove the live photo';
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminSheet
      open={row !== null}
      onClose={onClose}
      title={`Hole ${row.hole_no} photo`}
      subtitle={row.courseName ?? undefined}
      maxWidth={560}
      footer={
        isPending ? (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={onReject} disabled={busy || !reason} style={{ ...btnGhost(), opacity: busy || !reason ? 0.55 : 1 }}>
              Reject
            </button>
            <button onClick={onApprove} disabled={busy} style={btnPrimary(busy)}>
              {busy ? 'Working...' : 'Approve'}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: t.inkMuted }}>
            {row.status === 'approved' ? 'Approved' : `Rejected - ${holePhotoReasonLabel(row.reject_reason)}`}
          </div>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Submitted photo */}
        <div>
          <div style={label}>Submitted photo</div>
          <img
            src={row.media_url}
            alt={`Hole ${row.hole_no} submission`}
            style={{
              marginTop: 6, width: '100%', borderRadius: t.radius.md,
              border: `1px solid ${t.line}`, display: 'block', objectFit: 'cover',
            }}
          />
        </div>

        {/* Course reference */}
        {row.courseThumbnail && (
          <div>
            <div style={label}>Course reference</div>
            <img
              src={row.courseThumbnail}
              alt={row.courseName ?? 'Course'}
              style={{
                marginTop: 6, width: '100%', height: 120, objectFit: 'cover',
                borderRadius: t.radius.md, border: `1px solid ${t.line}`,
              }}
            />
          </div>
        )}

        <div>
          <Field k="Course" v={row.courseName ?? 'Unknown course'} />
          <Field k="Hole" v={`${row.hole_no}`} />
          <Field k="Par" v={proof.data?.par != null ? `${proof.data.par}` : 'Not recorded'} />
          <Field k="Contributor" v={row.contributorName ?? 'Unknown member'} />
          <Field
            k="Round played"
            v={proof.data?.found
              ? (proof.data.playDate ? new Date(proof.data.playDate).toLocaleDateString() : 'Date not recorded')
              : 'No linked round'}
          />
          <Field k="Submitted" v={new Date(row.created_at).toLocaleString()} />
        </div>

        {/* Advisory checks - only when present */}
        {hasAuto && (
          <div style={{ border: `1px solid ${t.line}`, borderRadius: t.radius.md, padding: 12 }}>
            <div style={label}>Automated check (advisory)</div>
            <div style={{ fontSize: 13, color: t.ink, marginTop: 6 }}>
              {row.auto_verdict ?? 'No verdict'}
              {row.auto_confidence != null && ` - ${Math.round(row.auto_confidence * 100)}% confidence`}
            </div>
            {row.auto_notes && (
              <div style={{ fontSize: 12, color: t.inkMuted, marginTop: 4, lineHeight: 1.45 }}>{row.auto_notes}</div>
            )}
          </div>
        )}

        {/* Live photo on this hole */}
        {live.data && live.data.id !== row.id && (
          <div style={{ border: `1px solid ${t.line}`, borderRadius: t.radius.md, padding: 12 }}>
            <div style={label}>Already live on this hole</div>
            <img
              src={live.data.media_url}
              alt="Live hole photo"
              style={{ marginTop: 6, width: '100%', height: 120, objectFit: 'cover', borderRadius: t.radius.md }}
            />
            <div style={{ fontSize: 12, color: t.inkMuted, marginTop: 6 }}>
              By {live.data.contributorName ?? 'a member'}
            </div>
            <button onClick={onRemoveLive} disabled={busy} style={{ ...btnGhost(), marginTop: 8, color: t.dangerText }}>
              Remove from hole
            </button>
          </div>
        )}

        {/* Reject reason */}
        {isPending && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={label}>Reject reason</div>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as HolePhotoRejectReason | '')}
              style={{
                padding: '10px 12px', borderRadius: t.radius.md, border: `1px solid ${t.line}`,
                background: t.surface, color: t.ink, fontSize: 14,
              }}
            >
              <option value="">Select a reason</option>
              {HOLE_PHOTO_REJECT_REASONS.map((r) => (
                <option key={r} value={r}>{holePhotoReasonLabel(r)}</option>
              ))}
            </select>
            {reason === 'other' && (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tell the member why, in plain language"
                rows={3}
                style={{
                  padding: '10px 12px', borderRadius: t.radius.md, border: `1px solid ${t.line}`,
                  background: t.surface, color: t.ink, fontSize: 14, resize: 'vertical',
                }}
              />
            )}
          </div>
        )}

        {err && <div style={{ fontSize: 12, color: t.dangerText }}>{err}</div>}
      </div>
    </AdminSheet>
  );
}
