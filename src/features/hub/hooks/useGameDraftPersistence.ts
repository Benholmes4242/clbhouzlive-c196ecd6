/**
 * useGameDraftPersistence - Persists game/trip draft in localStorage with 24h expiry
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  SheetMode, 
  GameVisibility, 
  TripVisibility, 
  HoleCount, 
  GameType,
  SelectedCourse,
  SelectedPlayer,
  TripCourseStop 
} from '../components/create-game-trip-v2/types';

const DRAFT_KEY = 'clbhouz-create-game-draft';
const DRAFT_EXPIRY_HOURS = 24;

export interface GameTripDraft {
  mode: SheetMode;
  // Game fields
  gameCourse: SelectedCourse | null;
  gamePlayers: SelectedPlayer[];
  gameVisibility: GameVisibility;
  gameDate: string | null; // ISO string
  gameTime: string;
  gameHoles: HoleCount;
  gameType: GameType;
  gameNotes: string;
  // Trip fields
  tripItinerary: TripCourseStop[];
  tripAttendees: SelectedPlayer[];
  tripVisibility: TripVisibility;
  tripStartDate: string | null; // ISO string
  tripEndDate: string | null; // ISO string
  tripNotes: string;
  // Metadata
  savedAt: number;
}

interface UseGameDraftPersistenceReturn {
  hasDraft: boolean;
  draft: GameTripDraft | null;
  showRestoreDialog: boolean;
  setShowRestoreDialog: (show: boolean) => void;
  restoreDraft: () => GameTripDraft | null;
  saveDraft: (draft: Omit<GameTripDraft, 'savedAt'>) => void;
  clearDraft: () => void;
}

export function useGameDraftPersistence(): UseGameDraftPersistenceReturn {
  const [draft, setDraft] = useState<GameTripDraft | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const parsed: GameTripDraft = JSON.parse(savedDraft);
        const hoursSinceSave = (Date.now() - parsed.savedAt) / (1000 * 60 * 60);
        
        if (hoursSinceSave < DRAFT_EXPIRY_HOURS) {
          // Check if draft has meaningful data (at least course or itinerary)
          const hasData = parsed.gameCourse || parsed.tripItinerary?.length > 0;
          if (hasData) {
            setDraft(parsed);
            setHasDraft(true);
            setShowRestoreDialog(true);
          } else {
            // Empty draft, clear it
            localStorage.removeItem(DRAFT_KEY);
          }
        } else {
          // Expired, clear it
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch (err) {
      console.error('Error loading draft:', err);
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  const saveDraft = useCallback((draftData: Omit<GameTripDraft, 'savedAt'>) => {
    try {
      const fullDraft: GameTripDraft = {
        ...draftData,
        savedAt: Date.now(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(fullDraft));
      setDraft(fullDraft);
      setHasDraft(true);
    } catch (err) {
      console.error('Error saving draft:', err);
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setDraft(null);
    setHasDraft(false);
    setShowRestoreDialog(false);
  }, []);

  const restoreDraft = useCallback(() => {
    setShowRestoreDialog(false);
    return draft;
  }, [draft]);

  return {
    hasDraft,
    draft,
    showRestoreDialog,
    setShowRestoreDialog,
    restoreDraft,
    saveDraft,
    clearDraft,
  };
}
