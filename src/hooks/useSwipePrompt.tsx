import { useState, useEffect, useCallback } from 'react';

interface SwipeActivityData {
  hasSeenPrompt: boolean;
  swipeCount: number;
  lastVisit: string;
  sessionStartTime: string;
}

const STORAGE_KEY = 'clubhouse-swipe-activity';
const MIN_SWIPES_TO_HIDE = 2;
const PROMPT_COOLDOWN_HOURS = 24;

export const useSwipePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [activityData, setActivityData] = useState<SwipeActivityData | null>(null);

  // Load activity data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored) as SwipeActivityData;
        setActivityData(data);
      } catch {
        // Invalid data, start fresh
        initializeNewUser();
      }
    } else {
      // New user
      initializeNewUser();
    }
  }, []);

  const initializeNewUser = () => {
    const newData: SwipeActivityData = {
      hasSeenPrompt: false,
      swipeCount: 0,
      lastVisit: new Date().toISOString(),
      sessionStartTime: new Date().toISOString()
    };
    setActivityData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  // Check if we should show the prompt
  useEffect(() => {
    if (!activityData) return;

    const now = new Date();
    const lastVisit = new Date(activityData.lastVisit);
    const hoursSinceLastVisit = (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60);
    
    // Show prompt if:
    // 1. User hasn't seen it before, OR
    // 2. User has low swipe count and it's been a while since last visit, OR
    // 3. User is in their first session and hasn't swiped much
    const shouldShow = (
      !activityData.hasSeenPrompt ||
      (activityData.swipeCount < MIN_SWIPES_TO_HIDE && hoursSinceLastVisit > PROMPT_COOLDOWN_HOURS) ||
      (activityData.swipeCount === 0 && hoursSinceLastVisit < 1) // First session
    );

    if (shouldShow) {
      // Delay showing the prompt slightly to let the page load
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [activityData]);

  // Record a swipe action
  const recordSwipe = useCallback(() => {
    if (!activityData) return;

    const updatedData = {
      ...activityData,
      swipeCount: activityData.swipeCount + 1,
      lastVisit: new Date().toISOString()
    };

    setActivityData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

    // Hide prompt after first swipe
    if (showPrompt) {
      setShowPrompt(false);
    }
  }, [activityData, showPrompt]);

  // Mark prompt as seen and dismissed
  const dismissPrompt = useCallback(() => {
    if (!activityData) return;

    const updatedData = {
      ...activityData,
      hasSeenPrompt: true,
      lastVisit: new Date().toISOString()
    };

    setActivityData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    setShowPrompt(false);
  }, [activityData]);

  // Update last visit time when user returns
  const updateLastVisit = useCallback(() => {
    if (!activityData) return;

    const updatedData = {
      ...activityData,
      lastVisit: new Date().toISOString()
    };

    setActivityData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  }, [activityData]);

  return {
    showPrompt,
    recordSwipe,
    dismissPrompt,
    updateLastVisit,
    swipeCount: activityData?.swipeCount || 0
  };
};