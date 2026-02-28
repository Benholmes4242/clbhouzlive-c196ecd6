/**
 * CreateGameTripSheetV2 - Main composer sheet for creating games/trips
 * Uses edge function for game creation to ensure notifications are sent
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreateTrip } from '../../hooks/useCreateTrip';
import { useGameDraftPersistence } from '../../hooks/useGameDraftPersistence';
import { HubSharePanel, ShareEntityType } from '../share/HubSharePanel';

import { ModeToggle } from './ModeToggle';
import { HeroStartCard } from './HeroStartCard';
import { PlayersCard } from './PlayersCard';
import { PlayersCounter } from './PlayersCounter';
import { VisibilityChips } from './VisibilityChips';
import { GameDetailsSection } from './GameDetailsSection';
import { TripDatesCard } from './TripDatesCard';
import { TripItineraryList } from './TripItineraryList';
import { TripDetailsSection } from './TripDetailsSection';
import { CTABar } from './CTABar';
import { ChooseGolfClubSheetV2 } from './ChooseGolfClubSheetV2';
import { AddPlayersSheetV2 } from './AddPlayersSheetV2';
import { TripDateRangeSheet } from './TripDateRangeSheet';
import { RestoreDraftDialog } from './RestoreDraftDialog';

import type {
  SheetMode,
  GameVisibility,
  TripVisibility,
  GameType,
  HoleCount,
  SelectedCourse,
  SelectedPlayer,
  TripCourseStop,
  TripDraft,
} from './types';

interface CreateGameTripSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGameTripSheetV2({ isOpen, onClose }: CreateGameTripSheetV2Props) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  // Mode state
  const [mode, setMode] = useState<SheetMode>('game');
  
  // Game state
  const [gameCourse, setGameCourse] = useState<SelectedCourse | null>(null);
  const [gamePlayers, setGamePlayers] = useState<SelectedPlayer[]>([]);
  const [gameVisibility, setGameVisibility] = useState<GameVisibility>('friends');
  const [gameDetailsExpanded, setGameDetailsExpanded] = useState(false);
  const [gameDate, setGameDate] = useState<Date | null>(null);
  const [gameTime, setGameTime] = useState<string>('');
  const [gameHoles, setGameHoles] = useState<HoleCount>(18);
  const [gameType, setGameType] = useState<GameType>('casual');
  const [gameNotes, setGameNotes] = useState('');
  
  // Trip state
  const [tripItinerary, setTripItinerary] = useState<TripCourseStop[]>([]);
  const [tripAttendees, setTripAttendees] = useState<SelectedPlayer[]>([]);
  const [tripVisibility, setTripVisibility] = useState<TripVisibility>('invite');
  const [tripStartDate, setTripStartDate] = useState<Date | null>(null);
  const [tripEndDate, setTripEndDate] = useState<Date | null>(null);
  const [tripDetailsExpanded, setTripDetailsExpanded] = useState(false);
  const [tripNotes, setTripNotes] = useState('');
  
  // Sub-sheet states
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [showPlayersPicker, setShowPlayersPicker] = useState(false);
  const [showTripDatesPicker, setShowTripDatesPicker] = useState(false);
  const [coursePickerContext, setCoursePickerContext] = useState<'game' | 'trip-add'>('game');
  
  // Share panel state
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [createdEntityId, setCreatedEntityId] = useState<string | null>(null);
  const [createdEntityType, setCreatedEntityType] = useState<ShareEntityType>('game');
  const [createdEntityName, setCreatedEntityName] = useState<string>('');
  
  // Loading state
  const [isCreating, setIsCreating] = useState(false);
  
  // Draft persistence
  const {
    hasDraft,
    draft: pendingDraft,
    showRestoreDialog,
    setShowRestoreDialog,
    saveDraft,
    clearDraft,
  } = useGameDraftPersistence();
  
  // Trip mutation
  const createTripMutation = useCreateTrip();
  
  // Track if we've checked for draft on this open
  const hasCheckedDraft = useRef(false);
  
  // Check for draft on mount
  useEffect(() => {
    if (isOpen && hasDraft && !hasCheckedDraft.current) {
      hasCheckedDraft.current = true;
      setShowRestoreDialog(true);
    }
    if (!isOpen) {
      hasCheckedDraft.current = false;
    }
  }, [isOpen, hasDraft, setShowRestoreDialog]);
  
  // Save draft whenever form state changes (debounced via hook)
  useEffect(() => {
    if (!isOpen) return;
    
    // Only save if there's meaningful data
    if (gameCourse || tripItinerary.length > 0) {
      saveDraft({
        mode,
        gameCourse,
        gamePlayers,
        gameVisibility,
        gameDate: gameDate?.toISOString() || null,
        gameTime,
        gameHoles,
        gameType,
        gameNotes,
        tripItinerary,
        tripAttendees,
        tripVisibility,
        tripStartDate: tripStartDate?.toISOString() || null,
        tripEndDate: tripEndDate?.toISOString() || null,
        tripNotes,
      });
    }
  }, [
    isOpen, mode, gameCourse, gamePlayers, gameVisibility, 
    gameDate, gameTime, gameHoles, gameType, gameNotes,
    tripItinerary, tripAttendees, tripVisibility, tripStartDate, tripEndDate, tripNotes,
    saveDraft
  ]);
  
  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalHeight = document.body.style.height;
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100svh';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.height = originalHeight;
      };
    }
  }, [isOpen]);
  
  // Reset state when sheet closes (but don't clear draft)
  useEffect(() => {
    if (!isOpen) {
      // Reset after animation completes
      const timer = setTimeout(() => {
        setMode('game');
        setGameCourse(null);
        setGamePlayers([]);
        setGameVisibility('friends');
        setGameDetailsExpanded(false);
        setGameDate(null);
        setGameTime('');
        setGameHoles(18);
        setGameType('casual');
        setGameNotes('');
        setTripItinerary([]);
        setTripAttendees([]);
        setTripVisibility('invite');
        setTripStartDate(null);
        setTripEndDate(null);
        setTripDetailsExpanded(false);
        setTripNotes('');
        setIsCreating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Handle restore draft
  const handleRestoreDraft = useCallback(() => {
    if (pendingDraft) {
      setMode(pendingDraft.mode);
      setGameCourse(pendingDraft.gameCourse);
      setGamePlayers(pendingDraft.gamePlayers);
      setGameVisibility(pendingDraft.gameVisibility);
      setGameDate(pendingDraft.gameDate ? new Date(pendingDraft.gameDate) : null);
      setGameTime(pendingDraft.gameTime);
      setGameHoles(pendingDraft.gameHoles);
      setGameType(pendingDraft.gameType);
      setGameNotes(pendingDraft.gameNotes);
      setTripItinerary(pendingDraft.tripItinerary);
      setTripAttendees(pendingDraft.tripAttendees);
      setTripVisibility(pendingDraft.tripVisibility);
      setTripStartDate(pendingDraft.tripStartDate ? new Date(pendingDraft.tripStartDate) : null);
      setTripEndDate(pendingDraft.tripEndDate ? new Date(pendingDraft.tripEndDate) : null);
      setTripNotes(pendingDraft.tripNotes);
    }
    setShowRestoreDialog(false);
  }, [pendingDraft, setShowRestoreDialog]);
  
  const handleStartFresh = useCallback(() => {
    clearDraft();
    setShowRestoreDialog(false);
  }, [clearDraft, setShowRestoreDialog]);
  
  // Derived state
  const maxPlayers = 4;
  const currentPlayers = 1 + gamePlayers.length; // Creator + selected players
  const hasCourseSelected = mode === 'game' ? !!gameCourse : tripItinerary.length > 0;
  const tripDatesSet = tripStartDate && tripEndDate;
  
  // Validation
  const canCreate = mode === 'game' 
    ? hasCourseSelected 
    : hasCourseSelected && tripStartDate !== null && tripEndDate !== null;
  
  const validationHint = mode === 'game'
    ? (!hasCourseSelected ? 'Choose a golf club to continue' : undefined)
    : (!hasCourseSelected ? 'Add your first course to continue' : !tripDatesSet ? 'Add trip dates to continue' : undefined);
  
  // Handlers
  const handleHeroTap = useCallback(() => {
    if (mode === 'game') {
      setCoursePickerContext('game');
      setShowCoursePicker(true);
    } else {
      setCoursePickerContext('trip-add');
      setShowCoursePicker(true);
    }
  }, [mode]);
  
  const handleCourseSelect = useCallback((course: { id: string; name: string; country: string; sub_country?: string; thumbnail_image?: string }) => {
    const selectedCourse: SelectedCourse = {
      id: course.id,
      name: course.name,
      country: course.country,
      sub_country: course.sub_country,
      location: course.sub_country || course.country,
      thumbnail_image: course.thumbnail_image,
    };
    
    if (coursePickerContext === 'game') {
      setGameCourse(selectedCourse);
    } else {
      // Add to trip itinerary
      const newStop: TripCourseStop = {
        id: nanoid(),
        courseId: course.id,
        courseName: course.name,
        courseCountry: course.country,
        courseThumbnail: course.thumbnail_image,
        courseLocation: course.sub_country || course.country,
        dayIndex: tripItinerary.length,
      };
      setTripItinerary(prev => [...prev, newStop]);
    }
    setShowCoursePicker(false);
  }, [coursePickerContext, tripItinerary.length]);
  
  const handleChangeCourse = useCallback(() => {
    setCoursePickerContext('game');
    setShowCoursePicker(true);
  }, []);
  
  const handleAddPlayers = useCallback(() => {
    setShowPlayersPicker(true);
  }, []);
  
  const handlePlayerSelect = useCallback((player: SelectedPlayer) => {
    const players = mode === 'game' ? gamePlayers : tripAttendees;
    const setPlayers = mode === 'game' ? setGamePlayers : setTripAttendees;
    
    // Check for duplicates
    if (players.some(p => p.id === player.id)) return;
    
    // Check max players for game mode
    if (mode === 'game' && currentPlayers >= maxPlayers) return;
    
    setPlayers(prev => [...prev, player]);
  }, [mode, gamePlayers, tripAttendees, currentPlayers, maxPlayers]);
  
  const handleRemovePlayer = useCallback((playerId: string) => {
    if (mode === 'game') {
      setGamePlayers(prev => prev.filter(p => p.id !== playerId));
    } else {
      setTripAttendees(prev => prev.filter(p => p.id !== playerId));
    }
  }, [mode]);
  
  const handleAddTripCourse = useCallback(() => {
    setCoursePickerContext('trip-add');
    setShowCoursePicker(true);
  }, []);
  
  const handleEditTripCourse = useCallback((stop: TripCourseStop) => {
    // Phase 1: Just log for now, Phase 2 will open editor sheet
    console.log('Edit trip course:', stop);
  }, []);
  
  const handleRemoveTripCourse = useCallback((stopId: string) => {
    setTripItinerary(prev => {
      const filtered = prev.filter(stop => stop.id !== stopId);
      // Re-index day numbers after removal
      return filtered.map((stop, index) => ({
        ...stop,
        dayIndex: index
      }));
    });
  }, []);
  
  const handleTripDatesChange = useCallback((start: Date, end: Date) => {
    setTripStartDate(start);
    setTripEndDate(end);
    setShowTripDatesPicker(false);
  }, []);
  
  // Create game using edge function (ensures notifications are sent)
  const handleCreateGame = useCallback(async () => {
    if (!gameCourse) return;
    
    setIsCreating(true);
    try {
      // Build start time
      let startTime = new Date().toISOString();
      if (gameDate) {
        const dateStr = gameDate.toISOString().split('T')[0];
        const timeStr = gameTime || '09:00';
        startTime = new Date(`${dateStr}T${timeStr}:00`).toISOString();
      }
      
      // Call edge function instead of direct insert
      const { data, error } = await supabase.functions.invoke('game-create', {
        body: {
          course_id: gameCourse.id,
          course_name: gameCourse.name,
          start_time: startTime,
          visibility: gameVisibility,
          slots_total: maxPlayers,
          note: gameNotes || null,
          holes: gameHoles,
          game_type: gameType,
          // Edge function expects tagged_user_ids and guest_participants
          tagged_user_ids: gamePlayers
            .filter(p => !p.isGuest)
            .map(p => p.id),
          guest_participants: gamePlayers
            .filter(p => p.isGuest)
            .map(p => ({ guest_name: p.name })),
        }
      });
      
      if (error) throw error;
      
      // Clear draft on success
      clearDraft();
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
      
      toast.success('Game created');
      
      // Open share panel
      if (data?.game_id || data?.game?.id) {
        setCreatedEntityId(data.game_id || data.game.id);
        setCreatedEntityType('game');
        setCreatedEntityName(gameCourse.name);
        setShowSharePanel(true);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Failed to create game:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create game');
    } finally {
      setIsCreating(false);
    }
  }, [
    gameCourse, gameDate, gameTime, gameVisibility, maxPlayers, 
    gameNotes, gameHoles, gameType, gamePlayers,
    clearDraft, queryClient, onClose
  ]);
  
  const handleCreate = useCallback(async () => {
    if (!canCreate) return;
    
    if (mode === 'game') {
      await handleCreateGame();
    } else {
      // Trip creation still uses the hook (can be migrated later)
      try {
        const draft: TripDraft = {
          startDate: tripStartDate!,
          endDate: tripEndDate!,
          visibility: tripVisibility,
          attendeeIds: tripAttendees.filter(p => !p.isGuest).map(p => p.id),
          guestAttendees: tripAttendees.filter(p => p.isGuest).map(p => p.name),
          notes: tripNotes || undefined,
          itinerary: tripItinerary,
        };
        
        const result = await createTripMutation.mutateAsync(draft);
        
        // Clear draft on success
        clearDraft();
        
        // Open share panel
        setCreatedEntityId(result.tripId);
        setCreatedEntityType('trip');
        setCreatedEntityName(tripItinerary[0]?.courseName || 'Golf Trip');
        setShowSharePanel(true);
      } catch (error) {
        console.error('Creation failed:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create');
      }
    }
  }, [
    canCreate, mode, handleCreateGame,
    tripStartDate, tripEndDate, tripVisibility, tripAttendees, tripNotes, tripItinerary,
    createTripMutation, clearDraft
  ]);
  
  const handleSharePanelClose = useCallback(() => {
    setShowSharePanel(false);
    setCreatedEntityId(null);
    onClose();
  }, [onClose]);
  
  if (!isOpen) return null;
  
  const portalRoot = document.getElementById('portal-root') || document.body;
  const isSubmitting = isCreating || createTripMutation.isPending;
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - only backdrop should blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999]"
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={onClose}
          />
          
          {/* Sheet - yellow→green gradient theme matching Create Game or Trip tile */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed inset-x-0 bottom-0 z-[10000] flex flex-col rounded-t-[24px] overflow-hidden"
            style={{
              height: '90svh',
              maxHeight: '90svh',
              backgroundColor: '#F8FAFC',
              boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.12)',
            }}
          >
            {/* Header bar */}
            <div className="flex-shrink-0">
              {/* Header with grabber and close button */}
              <div className="flex items-center justify-between pt-3 pb-2 px-5">
                <div className="w-8" /> {/* Spacer for centering */}
                <div className="w-10 h-1 rounded-full bg-slate-300" />
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-[0.96] hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            
            {/* Scrollable content */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain px-5 pb-32"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Title - locked height, increased weight */}
              <h2 
                className="h-8 flex items-center mb-4"
                style={{ 
                  color: '#1e293b',
                  fontSize: '20px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
              >
                {mode === 'game' ? 'Create a Game' : 'Create a Trip'}
              </h2>
              
              {/* Mode Toggle */}
              <ModeToggle mode={mode} onModeChange={setMode} />
              
              {/* Hero Card */}
              <div className="mt-5">
                <HeroStartCard
                  mode={mode}
                  selectedCourse={mode === 'game' ? gameCourse : (tripItinerary[0] ? {
                    id: tripItinerary[0].courseId,
                    name: tripItinerary[0].courseName,
                    country: tripItinerary[0].courseCountry,
                    location: tripItinerary[0].courseLocation,
                    thumbnail_image: tripItinerary[0].courseThumbnail,
                  } : null)}
                  onTap={handleHeroTap}
                  onChangeCourse={handleChangeCourse}
                />
              </div>
              
              {/* Progressive reveal content - 180ms ease-out animations */}
              <AnimatePresence mode="wait">
                {mode === 'game' && hasCourseSelected && (
                  <motion.div
                    key="game-content"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="space-y-4 mt-5"
                  >
                    {/* Who's playing */}
                    <PlayersCard
                      mode="game"
                      players={gamePlayers}
                      maxPlayers={maxPlayers}
                      onOpenPicker={handleAddPlayers}
                      onRemovePlayer={handleRemovePlayer}
                    />
                    
                    {/* Players counter */}
                    <PlayersCounter current={currentPlayers} max={maxPlayers} />
                    
                    {/* Visibility */}
                    <VisibilityChips
                      mode="game"
                      visibility={gameVisibility}
                      onVisibilityChange={(v) => setGameVisibility(v as GameVisibility)}
                    />
                    
                    {/* Add Details */}
                    <GameDetailsSection
                      isExpanded={gameDetailsExpanded}
                      onToggle={() => setGameDetailsExpanded(!gameDetailsExpanded)}
                      gameDate={gameDate}
                      onGameDateChange={setGameDate}
                      gameTime={gameTime}
                      onGameTimeChange={setGameTime}
                      holeCount={gameHoles}
                      onHoleCountChange={setGameHoles}
                      gameType={gameType}
                      onGameTypeChange={setGameType}
                      notes={gameNotes}
                      onNotesChange={setGameNotes}
                    />
                  </motion.div>
                )}
                
                {mode === 'trip' && hasCourseSelected && (
                  <motion.div
                    key="trip-content"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="space-y-4 mt-5"
                  >
                    {/* Trip Dates */}
                    <TripDatesCard
                      startDate={tripStartDate}
                      endDate={tripEndDate}
                      onOpenPicker={() => setShowTripDatesPicker(true)}
                    />
                    
                    {/* Trip Itinerary */}
                    <TripItineraryList
                      itinerary={tripItinerary}
                      onAddCourse={handleAddTripCourse}
                      onEditCourse={handleEditTripCourse}
                      onReorder={(newItinerary) => setTripItinerary(newItinerary)}
                      onRemoveCourse={handleRemoveTripCourse}
                    />
                    
                    {/* Who's attending */}
                    <PlayersCard
                      mode="trip"
                      players={tripAttendees}
                      onOpenPicker={handleAddPlayers}
                      onRemovePlayer={handleRemovePlayer}
                    />
                    
                    {/* Visibility */}
                    <VisibilityChips
                      mode="trip"
                      visibility={tripVisibility}
                      onVisibilityChange={(v) => setTripVisibility(v as TripVisibility)}
                    />
                    
                    {/* Add Details */}
                    <TripDetailsSection
                      isExpanded={tripDetailsExpanded}
                      onToggle={() => setTripDetailsExpanded(!tripDetailsExpanded)}
                      notes={tripNotes}
                      onNotesChange={setTripNotes}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* CTA Bar */}
            <CTABar
              mode={mode}
              isValid={canCreate}
              isSubmitting={isSubmitting}
              validationHint={validationHint}
              onSubmit={handleCreate}
            />
          </motion.div>
          
          {/* Sub-sheets */}
          <ChooseGolfClubSheetV2
            isOpen={showCoursePicker}
            onClose={() => setShowCoursePicker(false)}
            onSelect={handleCourseSelect}
          />
          
          <AddPlayersSheetV2
            isOpen={showPlayersPicker}
            onClose={() => setShowPlayersPicker(false)}
            onAddPlayer={handlePlayerSelect}
            selectedPlayers={mode === 'game' ? gamePlayers : tripAttendees}
            maxPlayers={mode === 'game' ? maxPlayers : undefined}
          />
          
          <TripDateRangeSheet
            isOpen={showTripDatesPicker}
            onClose={() => setShowTripDatesPicker(false)}
            startDate={tripStartDate}
            endDate={tripEndDate}
            onSave={handleTripDatesChange}
          />
          
          {/* Restore Draft Dialog */}
          <RestoreDraftDialog
            isOpen={showRestoreDialog}
            onContinueDraft={handleRestoreDraft}
            onStartFresh={handleStartFresh}
          />
          
          {/* Share Panel - shown after creation */}
          {createdEntityId && (
            <HubSharePanel
              isOpen={showSharePanel}
              onClose={handleSharePanelClose}
              entityType={createdEntityType}
              entityId={createdEntityId}
              entityName={createdEntityName}
              context="hub"
            />
          )}
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
