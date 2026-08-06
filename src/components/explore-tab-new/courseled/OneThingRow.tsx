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

  if (!resolved || !prompt || dismissed) return null;

  const copy =
    prompt.kind === 'rate'
      ? t('discover.prompt.rate', 'You played {{course}} - rate it?', {
          course: prompt.courseName,
        })
      : prompt.kind === 'finish'
        ? t(
            'discover.prompt.finish',
            'Your {{course}} rating is missing the detail - finish it?',
            { course: prompt.courseName },
          )
        : t('discover.prompt.photo', 'Add a photo from {{course}}?', {
            course: prompt.courseName,
          });

  const [actionKey, actionFallback] = ACTION_KEY[prompt.kind];

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
      {prompt.courseId && (
        <CourseImageFallback
          courseId={prompt.courseId}
          courseName={prompt.courseName}
          imageUrl={prompt.thumbnail}
          initialsSize={11}
          style={{ width: 34, height: 34, borderRadius: '34%', flexShrink: 0 }}
        />
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 12.5,
          fontWeight: 600,
          color: A.BODY,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {copy}
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
