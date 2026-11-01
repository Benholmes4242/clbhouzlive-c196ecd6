/**
 * MS3 §1–§3 — the composer's + sheet and its two pickers.
 *
 * §1 + SHEET: BizcSheet, no header, three rows — 40px #1E1E23 tile (radius 12,
 *   lucide icon 18 ink), title 15px/600, line 13px mute. "Share a round" is
 *   hidden when the member has no WHS connection or no rounds.
 * §2 ROUND PICKER: the member's rounds from the existing useAllScores, newest
 *   first, 30 at a time with load more. Row: 48px tile (gross 17px/700, to-par
 *   10.5px mute, E for 0), shortCourseName 15px/600, "{d MMM}" 12.5px mute
 *   (year when not this year).
 * §3 COURSE PICKER: the existing useCourseSearch with a 44px field, white
 *   caret.
 * Sending stays in the Composer through the existing msg_send path.
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Flag, MapPin } from 'lucide-react';
import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';
import '@/features/business-create/business-create.css';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { useCourseSearch, type CourseSearchResult } from '@/hooks/gam/useCourseSearch';
import type { WhsScore } from '@/lib/whs/types';

const INK = '#F5F7F8';
const MUTE = 'rgba(248,250,252,0.62)';
const TILE = '#1E1E23';
const RULE = 'rgba(255,255,255,0.08)';

/** "{d MMM}", with the year when the round is not from this year. */
export function shareRoundDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/** Gross and to-par for a picker tile; nulls when the round lacks either. */
export function roundTileFigures(score: WhsScore): { gross: number; toPar: string } | null {
  if (score.adjusted_gross == null) return null;
  const toPar =
    score.course_par != null
      ? (toParParts(score.adjusted_gross - score.course_par, 0)?.text ?? '')
      : '';
  return { gross: score.adjusted_gross, toPar };
}

const ActionRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  line: string;
  onTap: () => void;
  testId: string;
}> = ({ icon, title, line, onTap, testId }) => (
  <button
    type="button"
    data-testid={testId}
    onClick={onTap}
    className="active:opacity-70"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      width: '100%',
      padding: '14px 0',
      border: 'none',
      borderTop: `0.5px solid ${RULE}`,
      background: 'transparent',
      textAlign: 'left',
      cursor: 'pointer',
    }}
  >
    <span
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: TILE,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: INK,
        flex: 'none',
      }}
    >
      {icon}
    </span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: INK }}>{title}</span>
      <span style={{ display: 'block', fontSize: 13, color: MUTE, marginTop: 2 }}>{line}</span>
    </span>
  </button>
);

export const ShareActionSheet: React.FC<{
  open: boolean;
  canShareRound: boolean;
  onClose: () => void;
  onPickMedia: () => void;
  onShareRound: () => void;
  onShareCourse: () => void;
}> = ({ open, canShareRound, onClose, onPickMedia, onShareRound, onShareCourse }) => {
  const { t } = useTranslation('messaging');
  if (!open) return null;
  return (
    <BizcSheet title={t('share.addTitle', { defaultValue: 'Add' })} hideHeader hideAction testId="ms3-share-actions" onDone={onClose}>
      <div>
        <ActionRow
          testId="share-photo"
          icon={<Image size={18} />}
          title={t('share.photo', { defaultValue: 'Photo or video' })}
          line={t('share.photoLine', { defaultValue: 'From your library or camera' })}
          onTap={onPickMedia}
        />
        {canShareRound ? (
          <ActionRow
            testId="share-round"
            icon={<Flag size={18} />}
            title={t('share.round', { defaultValue: 'Share a round' })}
            line={t('share.roundLine', { defaultValue: 'Any of your rounds, as a scorecard' })}
            onTap={onShareRound}
          />
        ) : null}
        <ActionRow
          testId="share-course"
          icon={<MapPin size={18} />}
          title={t('share.course', { defaultValue: 'Share a course' })}
          line={t('share.courseLine', { defaultValue: 'Its page, with how it plays' })}
          onTap={onShareCourse}
        />
      </div>
    </BizcSheet>
  );
};

const PAGE = 30;

export const ShareRoundSheet: React.FC<{
  open: boolean;
  rounds: WhsScore[];
  onClose: () => void;
  onPick: (score: WhsScore) => void;
}> = ({ open, rounds, onClose, onPick }) => {
  const { t } = useTranslation('messaging');
  const [shown, setShown] = useState(PAGE);
  const ordered = useMemo(
    () => [...rounds].sort((a, b) => (a.play_date < b.play_date ? 1 : -1)),
    [rounds],
  );
  if (!open) return null;
  const visible = ordered.slice(0, shown);
  return (
    <BizcSheet
      title={t('share.round', { defaultValue: 'Share a round' })}
      sub={t('share.roundSub', { defaultValue: 'Your rounds, newest first.' })}
      hideAction
      testId="ms3-round-picker"
      onDone={onClose}
    >
      <div>
        {visible.map((s) => {
          const figs = roundTileFigures(s);
          const course = s.course?.name ?? '';
          return (
            <button
              key={s.id}
              type="button"
              data-testid={`round-pick-${s.id}`}
              onClick={() => onPick(s)}
              className="active:opacity-70"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 0',
                border: 'none',
                borderTop: `0.5px solid ${RULE}`,
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  flex: 'none',
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: TILE,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <b style={{ fontSize: 17, fontWeight: 700, color: INK, lineHeight: 1 }}>
                  {figs?.gross ?? '—'}
                </b>
                <span style={{ fontSize: 10.5, color: MUTE, marginTop: 2 }}>{figs?.toPar ?? ''}</span>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 15,
                    fontWeight: 600,
                    color: INK,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {shortCourseName(course)}
                </span>
                <span style={{ display: 'block', fontSize: 12.5, color: MUTE, marginTop: 2 }}>
                  {shareRoundDate(s.play_date)}
                </span>
              </span>
            </button>
          );
        })}
        {ordered.length > shown ? (
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            style={{
              width: '100%',
              padding: '14px 0',
              border: 'none',
              borderTop: `0.5px solid ${RULE}`,
              background: 'transparent',
              color: INK,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('share.loadMore', { defaultValue: 'Load more' })}
          </button>
        ) : null}
      </div>
    </BizcSheet>
  );
};

export const ShareCourseSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  onPick: (course: CourseSearchResult) => void;
}> = ({ open, onClose, onPick }) => {
  const { t } = useTranslation('messaging');
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useCourseSearch(query);
  if (!open) return null;
  return (
    <BizcSheet
      title={t('share.course', { defaultValue: 'Share a course' })}
      hideAction
      testId="ms3-course-picker"
      onDone={onClose}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('share.courseSearch', { defaultValue: 'Search courses' })}
        /* MS3 §3 — 44px field, white caret. */
        style={{
          width: '100%',
          height: 44,
          borderRadius: 14,
          background: TILE,
          border: `0.5px solid ${RULE}`,
          padding: '0 14px',
          fontSize: 15,
          color: INK,
          caretColor: '#FFFFFF',
          outline: 'none',
          marginBottom: 4,
        }}
      />
      <div>
        {isLoading ? null : (results ?? []).map((c) => (
          <button
            key={c.id}
            type="button"
            data-testid={`course-pick-${c.id}`}
            onClick={() => onPick(c)}
            className="active:opacity-70"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '12px 0',
              border: 'none',
              borderTop: `0.5px solid ${RULE}`,
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 15,
                  fontWeight: 600,
                  color: INK,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {shortCourseName(c.name)}
              </span>
              {c.region ? (
                <span style={{ display: 'block', fontSize: 12.5, color: MUTE, marginTop: 2 }}>
                  {c.region}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </BizcSheet>
  );
};
