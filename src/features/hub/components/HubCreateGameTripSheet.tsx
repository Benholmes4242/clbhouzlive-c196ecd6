/**
 * HubCreateGameTripSheet - WhatsApp-style composer for creating games/trips
 * 
 * Opens to 75% height
 * Game/Trip toggle at top with Hub glass styling
 * Composer-style fields (not form-like)
 * Sticky Create CTA at bottom
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Users, ChevronDown, ChevronUp, Calendar, Clock, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import '../home/hubThemeLight.css';

type SheetMode = 'game' | 'trip';
type Visibility = 'public' | 'friends' | 'club' | 'private' | 'invite';

interface SelectedCourse {
  id: string;
  name: string;
  location?: string;
}

interface SelectedPlayer {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface HubCreateGameTripSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: SheetMode;
}

const GAME_VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends' },
  { value: 'club', label: 'Club Only' },
  { value: 'private', label: 'Private' },
];

const TRIP_VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: 'invite', label: 'Invite Only' },
  { value: 'friends', label: 'Friends' },
  { value: 'club', label: 'Club Only' },
];

const SLOT_OPTIONS = [0, 1, 2, 3, 4];

export function HubCreateGameTripSheet({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialMode = 'game' 
}: HubCreateGameTripSheetProps) {
  const rootScrollTopRef = useRef(0);
  const wasOpenRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Form state
  const [mode, setMode] = useState<SheetMode>(initialMode);
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('friends');
  const [slots, setSlots] = useState(2);
  const [showDetails, setShowDetails] = useState(false);
  const [gameDate, setGameDate] = useState<Date | null>(null);
  const [gameTime, setGameTime] = useState<string>('');
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [gameType, setGameType] = useState<'casual' | 'practice' | 'match'>('casual');
  const [notes, setNotes] = useState('');
  const [tripStartDate, setTripStartDate] = useState<Date | null>(null);
  const [tripEndDate, setTripEndDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when sheet opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedCourse(null);
      setSelectedPlayers([]);
      setVisibility('friends');
      setSlots(2);
      setShowDetails(false);
      setGameDate(null);
      setGameTime('');
      setHoleCount(18);
      setGameType('casual');
      setNotes('');
      setTripStartDate(null);
      setTripEndDate(null);
    }
  }, [isOpen, initialMode]);

  // Scroll-lock
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;

    if (isOpen && !wasOpenRef.current) {
      rootScrollTopRef.current = rootEl.scrollTop;
      rootEl.style.overflow = 'hidden';
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      rootEl.style.overflow = '';
      rootEl.scrollTop = rootScrollTopRef.current;
      wasOpenRef.current = false;
    }

    return () => {
      if (wasOpenRef.current) {
        rootEl.style.overflow = '';
        rootEl.scrollTop = rootScrollTopRef.current;
        wasOpenRef.current = false;
      }
    };
  }, [isOpen]);

  const handleSheetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleModeChange = (newMode: SheetMode) => {
    haptic('light');
    setMode(newMode);
    // Reset visibility to mode-appropriate default
    setVisibility(newMode === 'trip' ? 'invite' : 'friends');
  };

  const visibilityOptions = mode === 'game' ? GAME_VISIBILITY_OPTIONS : TRIP_VISIBILITY_OPTIONS;

  const isValid = useMemo(() => {
    if (!selectedCourse) return false;
    return true;
  }, [selectedCourse]);

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    haptic('medium');

    try {
      // TODO: Integrate with actual create game/trip API
      console.log('Creating', mode, {
        course: selectedCourse,
        players: selectedPlayers,
        visibility,
        slots: mode === 'game' ? slots : undefined,
        date: mode === 'game' ? gameDate : tripStartDate,
        endDate: mode === 'trip' ? tripEndDate : undefined,
        time: mode === 'game' ? gameTime : undefined,
        holeCount: mode === 'game' ? holeCount : undefined,
        gameType: mode === 'game' ? gameType : undefined,
        notes,
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock course selection
  const handleSelectCourse = () => {
    haptic('light');
    setSelectedCourse({
      id: 'mock-1',
      name: 'Royal Portrush',
      location: 'Northern Ireland',
    });
  };

  // Mock player addition
  const handleAddPlayers = () => {
    haptic('light');
    const mockPlayer: SelectedPlayer = {
      id: `player-${Date.now()}`,
      name: 'Ben Thompson',
    };
    setSelectedPlayers(prev => [...prev, mockPlayer]);
  };

  const handleRemovePlayer = (playerId: string) => {
    haptic('light');
    setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 z-[10003]"
            style={{ touchAction: 'none' }}
            onClick={onClose}
          />

          {/* Sheet - 75% height */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10004] rounded-t-[26px] overflow-hidden flex flex-col"
            style={{
              height: '75vh',
              background: 'var(--hub-bg-start)',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12)',
              overscrollBehavior: 'contain',
            }}
            onClick={handleSheetClick}
          >
            {/* Header */}
            <div 
              className="flex-shrink-0"
              style={{ background: 'var(--hub-bg-start)' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div 
                  className="w-10 h-1 rounded-full"
                  style={{ background: 'var(--hub-stroke)' }}
                />
              </div>

              {/* Title bar */}
              <div className="flex items-center justify-between px-5 pb-3">
                <h2 
                  className="text-[18px] font-semibold"
                  style={{ color: 'var(--hub-text)' }}
                >
                  {mode === 'game' ? 'Create Game' : 'Create Trip'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'var(--hub-glass-bg)' }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--hub-text-sub)' }} />
                </button>
              </div>

              {/* Mode toggle - Hub glass elevated style */}
              <div className="px-5 pb-4">
                <div
                  className="inline-flex rounded-xl p-1 w-full"
                  style={{
                    background: 'var(--hub-glass-bg-input)',
                    border: '1px solid var(--hub-stroke-subtle)',
                  }}
                >
                  {(['game', 'trip'] as SheetMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => handleModeChange(m)}
                      className="flex-1 px-4 py-2.5 rounded-lg text-[14px] font-medium transition-all capitalize"
                      style={{
                        background: mode === m ? 'var(--hub-glass-bg-elevated)' : 'transparent',
                        border: mode === m ? '1px solid var(--hub-stroke-subtle)' : '1px solid transparent',
                        color: mode === m ? 'var(--hub-text)' : 'var(--hub-text-muted)',
                        boxShadow: mode === m ? 'var(--hub-shadow-tile)' : 'none',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto px-5"
              style={{ 
                paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
                overscrollBehavior: 'contain',
              }}
            >
              {/* Where field - message-style tap to choose */}
              <div className="mb-4">
                {selectedCourse ? (
                  <div 
                    className="flex items-center gap-3 p-3.5 rounded-2xl"
                    style={{
                      background: 'var(--hub-glass-bg)',
                      border: '1px solid var(--hub-stroke-subtle)',
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--hub-glass-bg-input)' }}
                    >
                      <MapPin className="w-5 h-5" style={{ color: 'var(--hub-accent)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium" style={{ color: 'var(--hub-text)' }}>
                        {selectedCourse.name}
                      </div>
                      {selectedCourse.location && (
                        <div className="text-[13px]" style={{ color: 'var(--hub-text-sub)' }}>
                          {selectedCourse.location}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="text-[13px] font-medium px-2 py-1"
                      style={{ color: 'var(--hub-accent)' }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSelectCourse}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                    style={{
                      background: 'var(--hub-glass-bg)',
                      border: '1px solid var(--hub-stroke-subtle)',
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--hub-glass-bg-input)' }}
                    >
                      <MapPin className="w-5 h-5" style={{ color: 'var(--hub-text-dim)' }} />
                    </div>
                    <span 
                      className="text-[15px]"
                      style={{ color: 'var(--hub-text-muted)' }}
                    >
                      {mode === 'game' ? 'Where are you playing?' : 'Where is the trip based?'}
                    </span>
                  </button>
                )}
              </div>

              {/* Who field */}
              <div className="mb-4">
                <div 
                  className="rounded-2xl p-3.5"
                  style={{
                    background: 'var(--hub-glass-bg)',
                    border: '1px solid var(--hub-stroke-subtle)',
                  }}
                >
                  {/* Player chips */}
                  <div className="flex flex-wrap gap-2">
                    {selectedPlayers.map(player => (
                      <div
                        key={player.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                        style={{
                          background: 'var(--hub-glass-bg-input)',
                          border: '1px solid var(--hub-stroke-subtle)',
                        }}
                      >
                        <span className="text-[13px] font-medium" style={{ color: 'var(--hub-text)' }}>
                          {player.name}
                        </span>
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--hub-stroke)' }}
                        >
                          <X className="w-3 h-3" style={{ color: 'var(--hub-text-sub)' }} />
                        </button>
                      </div>
                    ))}

                    {/* Add button */}
                    <button
                      onClick={handleAddPlayers}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors"
                      style={{
                        background: 'transparent',
                        border: '1px dashed var(--hub-stroke)',
                      }}
                    >
                      <Plus className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                      <span className="text-[13px]" style={{ color: 'var(--hub-text-dim)' }}>
                        {mode === 'game' ? 'Add golfers' : 'Add attendees'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Visibility chips */}
              <div className="mb-4">
                <label 
                  className="text-[12px] font-medium uppercase tracking-wide mb-2 block"
                  style={{ color: 'var(--hub-text-dim)' }}
                >
                  Visibility
                </label>

                <div className="flex flex-wrap gap-2">
                  {visibilityOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        haptic('light');
                        setVisibility(option.value);
                      }}
                      className="px-4 py-2 rounded-full text-[13px] font-medium transition-all"
                      style={{
                        background: visibility === option.value 
                          ? 'var(--hub-text)' 
                          : 'var(--hub-glass-bg)',
                        color: visibility === option.value 
                          ? 'white' 
                          : 'var(--hub-text-sub)',
                        border: visibility === option.value 
                          ? '1px solid var(--hub-text)'
                          : '1px solid var(--hub-stroke-subtle)',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slots (Game only) - rounded pill style */}
              {mode === 'game' && (
                <div className="mb-4">
                  <label 
                    className="text-[12px] font-medium uppercase tracking-wide mb-2 block"
                    style={{ color: 'var(--hub-text-dim)' }}
                  >
                    Slots Available
                  </label>

                  <div className="flex gap-2">
                    {SLOT_OPTIONS.map(num => (
                      <button
                        key={num}
                        onClick={() => {
                          haptic('light');
                          setSlots(num);
                        }}
                        className="w-10 h-10 rounded-full text-[14px] font-semibold transition-all"
                        style={{
                          background: slots === num 
                            ? 'var(--hub-text)' 
                            : 'var(--hub-glass-bg)',
                          color: slots === num 
                            ? 'white' 
                            : 'var(--hub-text-sub)',
                          border: slots === num 
                            ? '1px solid var(--hub-text)'
                            : '1px solid var(--hub-stroke-subtle)',
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional details accordion - WhatsApp style */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    haptic('light');
                    setShowDetails(!showDetails);
                  }}
                  className="w-full flex items-center justify-between py-3 text-left"
                  style={{
                    borderTop: '1px solid var(--hub-stroke-subtle)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Plus 
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        showDetails && "rotate-45"
                      )}
                      style={{ color: 'var(--hub-text-dim)' }}
                    />
                    <span 
                      className="text-[14px]"
                      style={{ color: 'var(--hub-text-sub)' }}
                    >
                      Add details (optional)
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-4">
                        {mode === 'game' ? (
                          <>
                            {/* Date & Time for games */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label 
                                  className="text-[12px] font-medium mb-1.5 block"
                                  style={{ color: 'var(--hub-text-dim)' }}
                                >
                                  Date
                                </label>
                                <button
                                  className="w-full flex items-center gap-2 p-3 rounded-xl text-left"
                                  style={{
                                    background: 'var(--hub-glass-bg)',
                                    border: '1px solid var(--hub-stroke-subtle)',
                                  }}
                                >
                                  <Calendar className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                                  <span 
                                    className="text-[14px]"
                                    style={{ color: gameDate ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                                  >
                                    {gameDate ? format(gameDate, 'MMM d') : 'Pick date'}
                                  </span>
                                </button>
                              </div>
                              <div>
                                <label 
                                  className="text-[12px] font-medium mb-1.5 block"
                                  style={{ color: 'var(--hub-text-dim)' }}
                                >
                                  Time
                                </label>
                                <button
                                  className="w-full flex items-center gap-2 p-3 rounded-xl text-left"
                                  style={{
                                    background: 'var(--hub-glass-bg)',
                                    border: '1px solid var(--hub-stroke-subtle)',
                                  }}
                                >
                                  <Clock className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                                  <span 
                                    className="text-[14px]"
                                    style={{ color: gameTime ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                                  >
                                    {gameTime || 'Pick time'}
                                  </span>
                                </button>
                              </div>
                            </div>

                            {/* Holes */}
                            <div>
                              <label 
                                className="text-[12px] font-medium mb-1.5 block"
                                style={{ color: 'var(--hub-text-dim)' }}
                              >
                                Holes
                              </label>
                              <div className="flex gap-2">
                                {([9, 18] as const).map(num => (
                                  <button
                                    key={num}
                                    onClick={() => {
                                      haptic('light');
                                      setHoleCount(num);
                                    }}
                                    className="flex-1 py-2.5 rounded-full text-[14px] font-medium transition-all"
                                    style={{
                                      background: holeCount === num 
                                        ? 'var(--hub-text)' 
                                        : 'var(--hub-glass-bg)',
                                      color: holeCount === num 
                                        ? 'white' 
                                        : 'var(--hub-text-sub)',
                                      border: holeCount === num 
                                        ? '1px solid var(--hub-text)'
                                        : '1px solid var(--hub-stroke-subtle)',
                                    }}
                                  >
                                    {num} holes
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Game type */}
                            <div>
                              <label 
                                className="text-[12px] font-medium mb-1.5 block"
                                style={{ color: 'var(--hub-text-dim)' }}
                              >
                                Type
                              </label>
                              <div className="flex gap-2">
                                {(['casual', 'practice', 'match'] as const).map(type => (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      haptic('light');
                                      setGameType(type);
                                    }}
                                    className="flex-1 py-2.5 rounded-full text-[14px] font-medium transition-all capitalize"
                                    style={{
                                      background: gameType === type 
                                        ? 'var(--hub-text)' 
                                        : 'var(--hub-glass-bg)',
                                      color: gameType === type 
                                        ? 'white' 
                                        : 'var(--hub-text-sub)',
                                      border: gameType === type 
                                        ? '1px solid var(--hub-text)'
                                        : '1px solid var(--hub-stroke-subtle)',
                                    }}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Trip dates */
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label 
                                className="text-[12px] font-medium mb-1.5 block"
                                style={{ color: 'var(--hub-text-dim)' }}
                              >
                                Start Date
                              </label>
                              <button
                                className="w-full flex items-center gap-2 p-3 rounded-xl text-left"
                                style={{
                                  background: 'var(--hub-glass-bg)',
                                  border: '1px solid var(--hub-stroke-subtle)',
                                }}
                              >
                                <Calendar className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                                <span 
                                  className="text-[14px]"
                                  style={{ color: tripStartDate ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                                >
                                  {tripStartDate ? format(tripStartDate, 'MMM d') : 'Start'}
                                </span>
                              </button>
                            </div>
                            <div>
                              <label 
                                className="text-[12px] font-medium mb-1.5 block"
                                style={{ color: 'var(--hub-text-dim)' }}
                              >
                                End Date
                              </label>
                              <button
                                className="w-full flex items-center gap-2 p-3 rounded-xl text-left"
                                style={{
                                  background: 'var(--hub-glass-bg)',
                                  border: '1px solid var(--hub-stroke-subtle)',
                                }}
                              >
                                <Calendar className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                                <span 
                                  className="text-[14px]"
                                  style={{ color: tripEndDate ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                                >
                                  {tripEndDate ? format(tripEndDate, 'MMM d') : 'End'}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        <div>
                          <label 
                            className="text-[12px] font-medium mb-1.5 block"
                            style={{ color: 'var(--hub-text-dim)' }}
                          >
                            Notes
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes..."
                            rows={3}
                            className="w-full p-3 rounded-xl text-[14px] resize-none"
                            style={{
                              background: 'var(--hub-glass-bg)',
                              border: '1px solid var(--hub-stroke-subtle)',
                              color: 'var(--hub-text)',
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sticky Create CTA - premium soft style */}
            <div 
              className="absolute bottom-0 left-0 right-0 z-20"
              style={{ 
                background: 'var(--hub-bg-start)',
                borderTop: '1px solid var(--hub-stroke-subtle)',
                padding: '12px 20px',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* Validation hint - soft */}
              {!isValid && (
                <p 
                  className="text-[12px] text-center mb-2"
                  style={{ color: 'var(--hub-text-muted)' }}
                >
                  Choose a course to continue
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: isValid 
                    ? 'linear-gradient(135deg, #6E9277 0%, #7FA888 100%)'
                    : 'var(--hub-glass-bg-input)',
                  color: isValid ? 'white' : 'var(--hub-text-muted)',
                  boxShadow: isValid ? '0 2px 12px rgba(110, 146, 119, 0.25)' : 'none',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  mode === 'game' ? 'Create Game' : 'Create Trip'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default HubCreateGameTripSheet;
