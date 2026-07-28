/**
 * H2 — contribution affordance for a single hole.
 *
 * Shown inside the expanded hole card when the viewer has a logged round at
 * the course. States: submit / uploading / in review / rejected / live.
 */
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  useApprovedHoleMedia,
  useMyHoleMedia,
  useSubmitHolePhoto,
} from '@/hooks/courses/useHoleMedia';

const INK = '#0F172A';
const INK_06 = 'rgba(15,23,42,0.06)';
const INK_55 = 'rgba(15,23,42,0.55)';
const GOLD_INK = '#C97211';

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

interface Props {
  courseId?: string;
  holeNo: number;
  /** Viewer has a logged round at this course. */
  eligible: boolean;
}

export const AddHolePhotoRow: React.FC<Props> = ({ courseId, holeNo, eligible }) => {
  const { t } = useTranslation(['courses']);
  const { user } = useSupabaseSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const { data: approved } = useApprovedHoleMedia(courseId);
  const { data: mine } = useMyHoleMedia(courseId, user?.id);
  const { submit, submitting, progress } = useSubmitHolePhoto();

  if (!courseId || !user) return null;

  const approvedPhoto = approved?.get(holeNo) ?? null;
  const myRow = mine?.get(holeNo) ?? null;

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    const res = await submit({ courseId, holeNo, file });
    if (res.ok) {
      setJustSubmitted(true);
      toast.success(t('courses:holePhoto.thanks'));
    } else {
      toast.error(res.error ?? t('courses:holePhoto.failed'));
    }
  };

  const chip = (label: string, color: string) => (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color,
        background: INK_06,
        borderRadius: 999,
        padding: '3px 8px',
      }}
    >
      {label}
    </span>
  );

  let body: React.ReactNode = null;

  if (myRow || justSubmitted) {
    const status = myRow?.status ?? 'pending';
    if (status === 'pending') {
      body = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {chip(t('courses:holePhoto.inReview'), GOLD_INK)}
          <span style={{ fontSize: 11.5, color: INK_55 }}>{t('courses:holePhoto.inReviewNote')}</span>
        </div>
      );
    } else if (status === 'rejected') {
      body = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {chip(t('courses:holePhoto.notUsed'), INK_55)}
          <span style={{ fontSize: 11.5, color: INK_55 }}>
            {myRow?.reject_reason || t('courses:holePhoto.notUsedNote')}
          </span>
        </div>
      );
    } else {
      body = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {chip(t('courses:holePhoto.live'), GOLD_INK)}
          <span style={{ fontSize: 11.5, color: INK_55 }}>{t('courses:holePhoto.liveNote')}</span>
        </div>
      );
    }
  } else if (submitting) {
    body = (
      <span style={{ fontSize: 11.5, color: INK_55 }}>
        {t('courses:holePhoto.uploading', { percent: progress.percent })}
      </span>
    );
  } else if (eligible) {
    body = (
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1px solid ${INK_06}`,
          background: '#FFFFFF',
          borderRadius: 999,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 700,
          color: INK,
          cursor: 'pointer',
          minHeight: 36,
        }}
      >
        {t('courses:holePhoto.add', { hole: ordinal(holeNo) })}
      </button>
    );
  } else if (approvedPhoto?.contributorName) {
    body = (
      <span style={{ fontSize: 11.5, color: INK_55 }}>
        {t('courses:holePhoto.credit', { name: approvedPhoto.contributorName })}
      </span>
    );
  }

  if (!body) return null;

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {approvedPhoto && (
        <div style={{ borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
          <img
            src={approvedPhoto.media_url}
            alt={t('courses:holePhoto.alt', { hole: holeNo })}
            loading="lazy"
            style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }}
          />
        </div>
      )}
      {body}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void onPick(e.target.files?.[0]);
          e.currentTarget.value = '';
        }}
      />
    </div>
  );
};

export default AddHolePhotoRow;
