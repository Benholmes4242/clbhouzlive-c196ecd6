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
import { ChevronRight, Users, X } from 'lucide-react';

import { A, SANS, FIGS, LABEL } from './tokens';
import CourseImageFallback from './CourseImageFallback';
import { relativeDay } from './discoverWhen';

import { analyticsEvents } from '@/utils/analyticsEvents';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import {
  useDiscoverPrompt,
  type DiscoverPromptKind,
} from './hooks/useDiscoverPrompt';

interface Props {
  userId: string | undefined;
  /** Opens the Find golfers sheet — the 'friends' kind's only destination. */
  onFindGolfers?: () => void;
}

const ACTION_KEY: Record<DiscoverPromptKind, [string, string]> = {
  rate: ['discover.prompt.actionRate', 'RATE'],
  finish: ['discover.prompt.actionFinish', 'FINISH'],
  photo: ['discover.prompt.actionPhoto', 'ADD'],
  friends: ['discover.prompt.actionFriends', 'FIND'],
};

export function OneThingRow({ userId, onFindGolfers }: Props) {
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
    if (prompt.kind === 'friends') {
      onFindGolfers?.();
      return;
    }
    if (prompt.kind === 'photo') {
      openForCourse({
        course: { id: prompt.courseId, name: prompt.courseName },
        returnPath: window.location.pathname,
      });
      return;
    }
    navigate(`/courses/${prompt.courseId}/rate`);
  }, [prompt, navigate, openForCourse, onFindGolfers]);

  const handleDismiss = useCallback(() => {
    if (prompt) {
      analyticsEvents.track('discover_prompt_dismiss', { kind: prompt.kind });
    }
    setDismissed(true);
  }, [prompt]);

  // NOTHING TO ASK: the row collapses to nothing so the first section eyebrow
  // starts at the same offset as the page title's former kicker.
  const shown = prompt;

  if (!resolved || !shown || dismissed) {
    return null;
  }

  // THE STATUS NO LONGER RESTATES THE ACTION. "not rated yet" beside RATE named
  // the lack and the remedy in the same row; the tappable one is the one worth
  // keeping, so line 2 states WHEN instead — a fact the app holds rather than
  // the impression "recently".
  const when = shown.at ? relativeDay(shown.at, t, 'long') : '';

  // NO COURSE BEHIND THIS ONE: the line is a promise, not a date.
  const isFriends = shown.kind === 'friends';

  const title = isFriends
    ? t('discover.prompt.friendsTitle', "See your friends' rounds")
    : shown.courseName;

  const status = isFriends
    ? t('discover.prompt.friendsStatus', 'Their scores land here')
    : when
    ? shown.kind === 'finish'
      ? t('discover.prompt.whenRated', 'Rated {{when}}', { when })
      : t('discover.prompt.whenPlayed', 'Played {{when}}', { when })
    : // NO DATE IN HAND: say what is true of the record rather than inventing an
      // age. Only reachable when the underlying column is null.
      shown.kind === 'finish'
      ? t('discover.prompt.statusFinishNoDate', 'Rated \u00B7 detail missing')
      : t('discover.prompt.statusNoDate', 'On your card');

  const [actionKey, actionFallback] = ACTION_KEY[shown.kind];



  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '0 16px',
        margin: '16px 0 20px',
        fontFamily: SANS,
        ...FIGS,
      }}
    >
      {isFriends ? (
        // THE ONLY DIFFERENCE FROM THE OTHER KINDS: no course, so the same
        // 36px squircle carries a glyph instead of a course image.
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            flexShrink: 0,
            background: A.BORDER,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: A.MUTE,
          }}
        >
          <Users size={17} strokeWidth={2.2} />
        </div>
      ) : (
        shown.courseId && (
        // PX RADIUS, not a percentage: 12px is the squircle used everywhere
        // else, and it does not re-shape itself if the size ever changes.
        <CourseImageFallback
          courseId={shown.courseId}
          courseName={shown.courseName}
          imageUrl={shown.thumbnail}
          initialsSize={12}
          style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0 }}
        />
        )
      )}

      {/* TWO single-line children: the course name is the only thing allowed to
          ellipsize; the status always reads in full. */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: '-0.015em',
            color: A.INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
        {/* A LABEL, so the course name clearly leads the row. */}
        <div
          style={{
            ...LABEL,
            fontSize: 6.5,
            color: A.DIM,
            marginTop: 4,
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {status}
        </div>
      </div>




      {/* BOTH CONTROLS KEEP THEIR 44px TAP TARGET: the glyphs shrink, the
          targets do not. */}
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
          fontSize: 9,
          fontWeight: 700,
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
          width: 22,
          height: 44,
          padding: 0,
          background: 'none',
          border: 'none',
          // DIM, so it stops competing with the action it sits beside.
          color: A.DIM,
          flexShrink: 0,
        }}
      >
        <X size={14} strokeWidth={2.2} />
      </button>

    </div>
  );
}

export default OneThingRow;
