/**
 * useVideoNudges - Growth hooks for video engagement
 * 
 * Phase 7E: Subtle one-time nudges to build habits
 * 
 * Nudge types:
 * 1. "Follow creators you like" - shown once after watching 2+ videos
 * 2. "Queue videos to watch later" - shown once after closing a video
 * 3. Creator follow suggestion - after watching 2+ videos from same creator
 * 4. Queue reminder - when returning with items in queue
 */

import { useState, useCallback, useMemo } from 'react';

// LocalStorage keys for one-time nudges
const NUDGE_FOLLOW_KEY = 'clbhouz_nudge_follow_seen';
const NUDGE_QUEUE_KEY = 'clbhouz_nudge_queue_seen';
const NUDGE_CREATOR_PREFIX = 'clbhouz_nudge_creator_';
const QUEUE_REMINDER_SHOWN_KEY = 'clbhouz_queue_reminder_session';

export type NudgeType = 'follow-creators' | 'use-queue' | 'follow-specific-creator' | 'queue-reminder';

interface NudgeState {
  followNudgeSeen: boolean;
  queueNudgeSeen: boolean;
}

interface UseVideoNudgesResult {
  // Check if a nudge should be shown
  shouldShowNudge: (type: NudgeType, context?: { creatorId?: string }) => boolean;
  // Mark a nudge as seen
  markNudgeSeen: (type: NudgeType, context?: { creatorId?: string }) => void;
  // Check if we should suggest following a specific creator
  shouldSuggestFollow: (creatorId: string, watchCount: number) => boolean;
  // Check if queue reminder should show (session-based)
  shouldShowQueueReminder: (queueLength: number) => boolean;
  // Mark queue reminder as shown for this session
  markQueueReminderShown: () => void;
  // Get nudge message for a type
  getNudgeMessage: (type: NudgeType, context?: { creatorName?: string }) => string;
}

export function useVideoNudges(): UseVideoNudgesResult {
  const [state, setState] = useState<NudgeState>(() => ({
    followNudgeSeen: localStorage.getItem(NUDGE_FOLLOW_KEY) === 'true',
    queueNudgeSeen: localStorage.getItem(NUDGE_QUEUE_KEY) === 'true',
  }));

  // Check if a nudge should be shown
  const shouldShowNudge = useCallback((type: NudgeType, context?: { creatorId?: string }): boolean => {
    switch (type) {
      case 'follow-creators':
        return !state.followNudgeSeen;
      case 'use-queue':
        return !state.queueNudgeSeen;
      case 'follow-specific-creator':
        if (!context?.creatorId) return false;
        return localStorage.getItem(`${NUDGE_CREATOR_PREFIX}${context.creatorId}`) !== 'true';
      case 'queue-reminder':
        return sessionStorage.getItem(QUEUE_REMINDER_SHOWN_KEY) !== 'true';
      default:
        return false;
    }
  }, [state.followNudgeSeen, state.queueNudgeSeen]);

  // Mark a nudge as seen
  const markNudgeSeen = useCallback((type: NudgeType, context?: { creatorId?: string }) => {
    switch (type) {
      case 'follow-creators':
        localStorage.setItem(NUDGE_FOLLOW_KEY, 'true');
        setState(s => ({ ...s, followNudgeSeen: true }));
        break;
      case 'use-queue':
        localStorage.setItem(NUDGE_QUEUE_KEY, 'true');
        setState(s => ({ ...s, queueNudgeSeen: true }));
        break;
      case 'follow-specific-creator':
        if (context?.creatorId) {
          localStorage.setItem(`${NUDGE_CREATOR_PREFIX}${context.creatorId}`, 'true');
        }
        break;
      case 'queue-reminder':
        sessionStorage.setItem(QUEUE_REMINDER_SHOWN_KEY, 'true');
        break;
    }
  }, []);

  // Check if we should suggest following a specific creator
  // Triggered after watching 2+ videos from same creator
  const shouldSuggestFollow = useCallback((creatorId: string, watchCount: number): boolean => {
    if (watchCount < 2) return false;
    const key = `${NUDGE_CREATOR_PREFIX}${creatorId}`;
    return localStorage.getItem(key) !== 'true';
  }, []);

  // Check if queue reminder should show
  const shouldShowQueueReminder = useCallback((queueLength: number): boolean => {
    if (queueLength === 0) return false;
    return sessionStorage.getItem(QUEUE_REMINDER_SHOWN_KEY) !== 'true';
  }, []);

  // Mark queue reminder as shown
  const markQueueReminderShown = useCallback(() => {
    sessionStorage.setItem(QUEUE_REMINDER_SHOWN_KEY, 'true');
  }, []);

  // Get nudge message
  const getNudgeMessage = useCallback((type: NudgeType, context?: { creatorName?: string }): string => {
    switch (type) {
      case 'follow-creators':
        return 'Follow creators you like to see more of their videos';
      case 'use-queue':
        return 'Add videos to your queue to watch later';
      case 'follow-specific-creator':
        return context?.creatorName 
          ? `Enjoying ${context.creatorName}'s content? Follow to stay updated`
          : 'Enjoying this creator? Follow to see more';
      case 'queue-reminder':
        return 'Your queue is waiting for you';
      default:
        return '';
    }
  }, []);

  return {
    shouldShowNudge,
    markNudgeSeen,
    shouldSuggestFollow,
    shouldShowQueueReminder,
    markQueueReminderShown,
    getNudgeMessage,
  };
}
