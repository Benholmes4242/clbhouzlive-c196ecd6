/**
 * useQuestOnboarding - Manages Quest onboarding state
 * Tracks intro seen, hints seen, first course played
 */

import { useState, useEffect, useCallback } from 'react';

const QUEST_ONBOARDING_KEY = 'quest_onboarding_seen';
const QUEST_JOURNEY_HINT_KEY = 'quest_journey_hint_seen';
const QUEST_TARGET_HINT_KEY = 'quest_target_hint_seen';
const QUEST_INDEX_HINT_KEY = 'quest_index_hint_seen';
const QUEST_FIRST_COURSE_KEY = 'quest_first_course_seen';

interface QuestOnboardingState {
  introSeen: boolean;
  journeyHintSeen: boolean;
  targetHintSeen: boolean;
  indexHintSeen: boolean;
  firstCourseSeen: boolean;
}

export function useQuestOnboarding(totalPlayed: number) {
  const [state, setState] = useState<QuestOnboardingState>(() => ({
    introSeen: localStorage.getItem(QUEST_ONBOARDING_KEY) === 'true',
    journeyHintSeen: localStorage.getItem(QUEST_JOURNEY_HINT_KEY) === 'true',
    targetHintSeen: localStorage.getItem(QUEST_TARGET_HINT_KEY) === 'true',
    indexHintSeen: localStorage.getItem(QUEST_INDEX_HINT_KEY) === 'true',
    firstCourseSeen: localStorage.getItem(QUEST_FIRST_COURSE_KEY) === 'true',
  }));

  // Should show intro overlay
  const shouldShowIntro = !state.introSeen && totalPlayed < 5;

  // Should show journey map hint
  const shouldShowJourneyHint = state.introSeen && !state.journeyHintSeen;

  // Should show target hint
  const shouldShowTargetHint = state.introSeen && !state.targetHintSeen && totalPlayed > 0;

  // Should show index hint (will be shown after idle time)
  const shouldShowIndexHint = !state.indexHintSeen;

  // Should show first course celebration
  const shouldShowFirstCourse = totalPlayed === 1 && !state.firstCourseSeen;

  // Mark intro as seen
  const markIntroSeen = useCallback(() => {
    localStorage.setItem(QUEST_ONBOARDING_KEY, 'true');
    setState((s) => ({ ...s, introSeen: true }));
  }, []);

  // Mark journey hint as seen
  const markJourneyHintSeen = useCallback(() => {
    localStorage.setItem(QUEST_JOURNEY_HINT_KEY, 'true');
    setState((s) => ({ ...s, journeyHintSeen: true }));
  }, []);

  // Mark target hint as seen
  const markTargetHintSeen = useCallback(() => {
    localStorage.setItem(QUEST_TARGET_HINT_KEY, 'true');
    setState((s) => ({ ...s, targetHintSeen: true }));
  }, []);

  // Mark index hint as seen
  const markIndexHintSeen = useCallback(() => {
    localStorage.setItem(QUEST_INDEX_HINT_KEY, 'true');
    setState((s) => ({ ...s, indexHintSeen: true }));
  }, []);

  // Mark first course celebration as seen
  const markFirstCourseSeen = useCallback(() => {
    localStorage.setItem(QUEST_FIRST_COURSE_KEY, 'true');
    setState((s) => ({ ...s, firstCourseSeen: true }));
  }, []);

  return {
    ...state,
    shouldShowIntro,
    shouldShowJourneyHint,
    shouldShowTargetHint,
    shouldShowIndexHint,
    shouldShowFirstCourse,
    markIntroSeen,
    markJourneyHintSeen,
    markTargetHintSeen,
    markIndexHintSeen,
    markFirstCourseSeen,
  };
}
