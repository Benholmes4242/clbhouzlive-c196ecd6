// PendingReviewCard — a staged review (pending_reviews) on the member's own
// Posts tab. Same footprint as PendingPostCard. error_message is NEVER
// rendered: it carries a Postgres code for diagnosis, not member copy.

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { useDiscardPendingReview, type PendingReviewRow } from '../hooks/usePendingReviews';
import { seedReviewDraftFromPending } from '../hooks/useReviewComposer';

interface Props {
  row: PendingReviewRow;
  userId: string | null;
}

// Same values PendingPostCard uses (its track/fallback ground and amber fill).
const TRACK_BG = 'rgba(255,255,255,0.08)';
const TRACK_FILL = '#F7931E';
const FAILED = '#F87171';

export const PendingReviewCard: React.FC<Props> = ({ row, userId }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const discard = useDiscardPendingReview(userId);
  const [busy, setBusy] = useState(false);
  const isFailed = row.effective_status !== 'uploading';

  useEffect(() => {
    if (row.error_message) {
      // eslint-disable-next-line no-console
      console.warn('[PendingReviewCard]', row.id, row.effective_status, row.error_message);
    }
  }, [row.id, row.effective_status, row.error_message]);

  const handleRetry = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    analyticsEvents.track('review_pending_retry', {
      pending_id: row.id,
      course_id: row.course_id,
      status: row.effective_status,
      media_expected: row.media_expected,
      error_message: row.error_message ?? undefined,
    });
    seedReviewDraftFromPending(row);
    try {
      await discard(row.id);
    } catch {
      // Staging again deletes the row anyway.
    }
    navigate(`/courses/${row.course_id}/rate`, {
      state: { retryOfPendingId: row.id, mediaExpected: row.media_expected },
    });
  }, [busy, row, discard, navigate]);

  const handleDiscard = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await discard(row.id);
      analyticsEvents.track('review_pending_discarded', {
        pending_id: row.id,
        course_id: row.course_id,
        status: row.effective_status,
      });
      toast.success(t('review.pending.discarded'));
    } catch {
      setBusy(false);
    }
  }, [busy, row, discard, t]);

  return (
    <div
      style={{
        background: A.PANEL,
        borderBottom: `0.5px solid ${A.BORDER}`,
        padding: '12px 16px',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            overflow: 'hidden',
            background: TRACK_BG,
            flexShrink: 0,
          }}
        >
          {row.course_thumbnail && (
            <img
              src={row.course_thumbnail}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: A.INK,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.course_name}
          </div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            {isFailed ? (
              <AlertCircle size={14} style={{ color: FAILED, flexShrink: 0 }} />
            ) : (
              <Loader2 size={14} style={{ color: TRACK_FILL, flexShrink: 0 }} className="animate-spin" />
            )}
            <span style={{ fontSize: 12, fontWeight: 600, color: isFailed ? FAILED : A.INK }}>
              {isFailed ? t('review.pending.failedTitle') : t('review.pending.postingTitle')}
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.45, color: A.MUTE }}>
            {isFailed ? t('review.pending.failedBody') : t('review.pending.postingBody')}
          </p>
          {isFailed && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={handleRetry}
                disabled={busy}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: A.INK,
                  background: TRACK_BG,
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {t('review.pending.retry')}
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={busy}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: A.MUTE,
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {t('review.pending.discard')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingReviewCard;
