/**
 * OneThingRow (BRIEF_DISCOVER_ONE_THING) — the single action Discover asks for.
 *
 * ONE ROW: no card, no border, no fill, no eyebrow, no subtitle. Thumbnail,
 * one ellipsised line, an ink caps action with a chevron, a mute dismiss.
 * Renders nothing until the suggestion is known so the page never shifts.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, X } from 'lucide-react';

import { A, SANS, FIGS } from './tokens';
import CourseImageFallback from './CourseImageFallback';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import {
  useDiscoverPrompt,
  type DiscoverPromptKind,
} from './hooks/useDiscoverPrompt';

interface Props {
  userId: string | undefined;
}

const ACTION_KEY: Record<DiscoverPromptKind, [string, string]> = {
  rate: ['discover.prompt.actionRate', 'RATE'],
  finish: ['discover.prompt.actionFinish', 'FINISH'],
  photo: ['discover.prompt.actionPhoto', 'ADD'],
};

export function OneThingRow({ userId }: Props) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const openForCourse = usePostStudioStore((s) => s.openPostStudioForCourse);
  const [dismissed, setDismissed] = useState(false);
  const shownRef = useRef<string | null>(null);

  const { prompt, resolved } = useDiscoverPrompt(userId);

  useEffect(() => {
    if (!prompt || dismissed) return;
    const sig = `${prompt.kind}:${prompt.courseId}`;
    if (shownRef.current === sig) return;
    shownRef.current = sig;
    analyticsEvents.track('discover_prompt_shown', { kind: prompt.kind });
  }, [prompt, dismissed]);

  const handleAction = useCallback(() => {
    if (!prompt) return;
    analyticsEvents.track('discover_prompt_action', { kind: prompt.kind });
    setDismissed(true);
    if (prompt.kind === 'photo') {
      openForCourse({
        course: { id: prompt.courseId, name: prompt.courseName },
        returnPath: window.location.pathname,
      });
      return;
    }
    navigate(`/courses/${prompt.courseId}/rate`);
  }, [prompt, navigate, openForCourse]);

  const handleDismiss = useCallback(() => {
    if (prompt) {
      analyticsEvents.track('discover_prompt_dismiss', { kind: prompt.kind });
    }
    setDismissed(true);
  }, [prompt]);

  // NOTHING TO ASK: the row collapses to the single 24px gap the page owes
  // between the title and the first section eyebrow — no orphaned space.
  const shown = prompt;

  if (!resolved || !shown || dismissed) {
    return <div aria-hidden style={{ height: 24 }} />;
  }

  // The row already shows a thumbnail and names the action, so the sentence
  // spends no width restating them: line 1 is the course, line 2 the status.
  const status =
    shown.kind === 'rate'
      ? t('discover.prompt.statusRate', 'Played recently \u00B7 not rated yet')
      : shown.kind === 'finish'
        ? t('discover.prompt.statusFinish', 'Rated \u00B7 category detail missing')
        : t('discover.prompt.statusPhoto', 'Played recently \u00B7 add a photo?');

  const [actionKey, actionFallback] = ACTION_KEY[shown.kind];


  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px',
        margin: '16px 0 20px',
        fontFamily: SANS,
        ...FIGS,
      }}
    >
      {shown.courseId && (
        <CourseImageFallback
          courseId={shown.courseId}
          courseName={shown.courseName}
          imageUrl={shown.thumbnail}
          initialsSize={12}
          style={{ width: 38, height: 38, borderRadius: '34%', flexShrink: 0 }}
        />
      )}

      {/* TWO single-line children: the course name is the only thing allowed to
          ellipsize; the status always reads in full. */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            lineHeight: 1.3,
            color: A.INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {shown.courseName}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.35,
            color: A.BODY,
            whiteSpace: 'nowrap',
          }}
        >
          {status}
        </div>
      </div>



      <button
        type="button"
        onClick={handleAction}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          height: 44,
          padding: 0,
          background: 'none',
          border: 'none',
          color: A.INK,
          fontFamily: SANS,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.13em',
          flexShrink: 0,
        }}
      >
        {t(actionKey, actionFallback)}
        <ChevronRight size={12} strokeWidth={2.4} />
      </button>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('discover.prompt.dismiss', 'Dismiss')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 44,
          padding: 0,
          background: 'none',
          border: 'none',
          color: A.MUTE,
          flexShrink: 0,
        }}
      >
        <X size={13} strokeWidth={2.2} />
      </button>
    </div>
  );
}

export default OneThingRow;
