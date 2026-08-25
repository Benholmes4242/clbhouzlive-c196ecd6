/**
 * H2 - contribution affordance for a single hole.
 *
 * Surfaces: the hole detail sheet ('hole_sheet') and the hardest/easiest holes
 * carousel card on Discover ('discover_card').
 *
 * Render rules:
 *  - approved photo exists -> show it, credited
 *  - viewer's row is pending -> their image + "In review" chip (only they see it)
 *  - viewer's row is rejected -> reason + "Try another photo" (delete, resubmit)
 *  - otherwise, if they have a logged round here -> the add affordance
 */
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  useCanContributeHole,
  useHolePhotos,
  useSubmitHolePhoto,
  type SubmitFailureReason,
} from '@/hooks/media/useHoleMedia';
import { A } from './analytical/tokens';


const AMBER_INK = '#C97211';

export type HolePhotoSurface = 'hole_sheet' | 'discover_card';

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

const ERROR_KEY: Record<SubmitFailureReason, string> = {
  duplicate: 'courses:holePhoto.errors.duplicate',
  rls: 'courses:holePhoto.errors.notEligible',
  upload: 'courses:holePhoto.errors.upload',
  not_signed_in: 'courses:holePhoto.errors.signedOut',
  unknown: 'courses:holePhoto.errors.generic',
};

interface Props {
  courseId?: string;
  holeNo: number;
  surface: HolePhotoSurface;
  /** Dark card background (Discover carousel). */
  dark?: boolean;
}

export const AddHolePhotoRow: React.FC<Props> = ({ courseId, holeNo, surface, dark = false }) => {
  const { t } = useTranslation(['courses']);
  const { user } = useSupabaseSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const shownRef = useRef(false);

  const { data: photo } = useHolePhotos(courseId, holeNo, user?.id);
  const { data: eligibility } = useCanContributeHole(courseId, user?.id);
  const { submit, deleteMine, submitting, progress } = useSubmitHolePhoto();
  const [busy, setBusy] = useState(false);

  const mine = photo?.mine ?? null;
  // Multiple approved photos per hole are permitted, so an existing approved
  // photo no longer blocks a contribution.
  const canAdd = Boolean(courseId && user && eligibility?.canContribute && !mine);


  useEffect(() => {
    if (!canAdd || shownRef.current || !courseId) return;
    shownRef.current = true;
    // callsite: hole_photo_cta_shown
    analyticsEvents.track('hole_photo_cta_shown', {
      course_id: courseId,
      hole_no: holeNo,
      surface,
    });
  }, [canAdd, courseId, holeNo, surface]);

  if (!courseId) return null;

  const muted = A.MUTE;
  const strong = A.INK;
  const hairline = A.BORDER;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('courses:holePhoto.errors.notImage'));
      return;
    }
    setBusy(true);
    const res = await submit({
      courseId,
      holeNo,
      file,
      proofScoreId: eligibility?.proofScoreId ?? null,
    });
    setBusy(false);
    if (res.ok) {
      // callsite: hole_photo_submitted
      analyticsEvents.track('hole_photo_submitted', { course_id: courseId, hole_no: holeNo });
      toast.success(t('courses:holePhoto.thanks'));
    } else {
      const reason = res.reason ?? 'unknown';
      // callsite: hole_photo_submit_failed
      analyticsEvents.track('hole_photo_submit_failed', {
        course_id: courseId,
        hole_no: holeNo,
        reason,
      });
      toast.error(t(ERROR_KEY[reason]));
    }
  };

  const picker = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        void handleFile(f);
      }}
    />
  );

  // Approved photos are rendered by the surrounding surface (hole gallery /
  // carousel card), so this row only ever owns the contribution states.


  // The viewer's own pending submission.
  if (mine?.status === 'pending') {
    return (
      <div>
        <img
          src={mine.media_url}
          alt={t('courses:holePhoto.alt', { ordinal: ordinal(holeNo) })}
          loading="lazy"
          style={{ width: '100%', borderRadius: 12, display: 'block', objectFit: 'cover', opacity: 0.85 }}
        />
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: AMBER_INK,
              border: `1px solid ${hairline}`,
              borderRadius: 999,
              padding: '2px 8px',
            }}
          >
            {t('courses:holePhoto.inReview')}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: muted }}>
            {t('courses:holePhoto.inReviewNote')}
          </span>
        </div>
      </div>
    );
  }

  // The viewer's own rejected submission: reason plus a retry.
  if (mine?.status === 'rejected') {
    return (
      <div>
        {picker}
        <div style={{ fontSize: 11, fontWeight: 600, color: muted, marginBottom: 6 }}>
          {mine.reject_reason || t('courses:holePhoto.notUsedNote')}
        </div>
        <button
          type="button"
          disabled={busy || submitting}
          onClick={async () => {
            setBusy(true);
            try {
              await deleteMine(mine.id, courseId, holeNo);
              inputRef.current?.click();
            } catch {
              toast.error(t('courses:holePhoto.errors.generic'));
            } finally {
              setBusy(false);
            }
          }}
          style={{
            border: `1px solid ${hairline}`,
            background: 'transparent',
            borderRadius: 999,
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: strong,
            minHeight: 40,
            cursor: 'pointer',
          }}
        >
          {t('courses:holePhoto.tryAnother')}
        </button>
      </div>
    );
  }

  if (!canAdd) return null;

  const uploading = busy || submitting;

  return (
    <div>
      {picker}
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        style={{
          width: '100%',
          border: `1px dashed ${dark ? 'rgba(255,255,255,0.28)' : A.BORDER}`,
          background: 'transparent',
          borderRadius: 12,
          padding: '10px 12px',
          fontSize: 12.5,
          fontWeight: 700,
          color: uploading ? muted : strong,
          minHeight: 44,
          cursor: uploading ? 'default' : 'pointer',
          textAlign: 'center',
        }}
      >
        {uploading
          ? t('courses:holePhoto.uploading', { percent: Math.round(progress?.percent ?? 0) })
          : t('courses:holePhoto.add', { ordinal: ordinal(holeNo) })}
      </button>
    </div>
  );
};

export default AddHolePhotoRow;
