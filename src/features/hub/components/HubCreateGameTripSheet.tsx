/**
 * HubCreateGameTripSheet - Message-composer style for creating games/trips
 * 
 * Matches Hub glass styling exactly (same surface as Games & Trips sheet)
 * Composer-style blocks (not form fields)
 * Premium CTA bar
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Users, Calendar, Clock, Plus, ChevronDown } from 'lucide-react';
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

  // Display capped players for trips
  const displayedPlayers = selectedPlayers.slice(0, 6);
  const extraPlayerCount = selectedPlayers.length - 6;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - same as Games & Trips sheet */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/25 z-[10003]"
            style={{ touchAction: 'none' }}
            onClick={onClose}
          />

          {/* Sheet - exact same surface as Games & Trips */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10004] rounded-t-[28px] overflow-hidden flex flex-col"
            style={{
              height: '75vh',
              background: 'linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08), 0 -1px 0 rgba(255, 255, 255, 0.5) inset',
              borderTop: '1px solid rgba(255, 255, 255, 0.8)',
              overscrollBehavior: 'contain',
            }}
            onClick={handleSheetClick}
          >
            {/* Header - compact, matching Games & Trips */}
            <div className="flex-shrink-0">
              {/* Drag handle - thinner, lower contrast */}
              <div className="flex justify-center pt-2.5 pb-1.5">
                <div 
                  className="w-8 h-[3px] rounded-full"
                  style={{ background: 'rgba(0, 0, 0, 0.1)' }}
                />
              </div>

              {/* Title bar with close button */}
              <div className="flex items-center justify-between px-5 pb-2">
                <h2 
                  className="text-[17px] font-semibold"
                  style={{ color: 'var(--hub-text)' }}
                >
                  {mode === 'game' ? 'Create Game' : 'Create Trip'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.03)',
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                  }}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" style={{ color: 'var(--hub-text-sub)' }} />
                </button>
              </div>

              {/* Mode toggle - Hub glass pill style */}
              <div className="px-5 pb-3">
                <div
                  className="inline-flex rounded-2xl p-0.5 w-full"
                  style={{
                    background: 'rgba(0, 0, 0, 0.03)',
                  }}
                >
                  {(['game', 'trip'] as SheetMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => handleModeChange(m)}
                      className="flex-1 px-4 py-1.5 rounded-xl text-[13px] font-medium transition-all capitalize"
                      style={{
                        background: mode === m ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                        border: mode === m ? '1px solid rgba(0, 0, 0, 0.04)' : '1px solid transparent',
                        color: mode === m ? 'var(--hub-text)' : 'var(--hub-text-muted)',
                        boxShadow: mode === m ? '0 1px 3px rgba(0, 0, 0, 0.04)' : 'none',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable content - unified surface, no section cards */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto px-5"
              style={{ 
                paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
                overscrollBehavior: 'contain',
              }}
            >
              {/* Composer flow - tight vertical rhythm */}
              <div className="flex flex-col gap-2.5">
                
                {/* WHERE - tappable composer row (no input styling) */}
                {selectedCourse ? (
                  <div 
                    className="flex items-center gap-3 py-2.5"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ 
                        background: 'rgba(110, 146, 119, 0.12)',
                      }}
                    >
                      <MapPin className="w-4 h-4" style={{ color: 'var(--hub-accent)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium" style={{ color: 'var(--hub-text)' }}>
                        {selectedCourse.name}
                      </div>
                      {selectedCourse.location && (
                        <div className="text-[12px]" style={{ color: 'var(--hub-text-dim)' }}>
                          {selectedCourse.location}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="text-[12px] font-medium px-2 py-1"
                      style={{ color: 'var(--hub-accent)' }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSelectCourse}
                    className="w-full flex items-center gap-3 py-2.5 text-left transition-all active:opacity-70"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                    >
                      <MapPin className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                    </div>
                    <span 
                      className="text-[15px]"
                      style={{ color: 'var(--hub-text-muted)' }}
                    >
                      {mode === 'game' ? 'Where are you playing?' : 'Where is the trip based?'}
                    </span>
                  </button>
                )}

                {/* WHO - chips inline with icon */}
                <div className="flex items-start gap-3 py-2.5">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                  >
                    <Users className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {selectedPlayers.length === 0 ? (
                      <button
                        onClick={handleAddPlayers}
                        className="text-[15px] transition-all active:opacity-70"
                        style={{ color: 'var(--hub-text-muted)' }}
                      >
                        {mode === 'game' ? "Who's playing?" : "Who's attending?"}
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {displayedPlayers.map(player => (
                          <div
                            key={player.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{
                              background: 'rgba(0, 0, 0, 0.04)',
                            }}
                          >
                            <span className="text-[13px] font-medium" style={{ color: 'var(--hub-text)' }}>
                              {player.name}
                            </span>
                            <button
                              onClick={() => handleRemovePlayer(player.id)}
                              className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                              style={{ background: 'rgba(0, 0, 0, 0.08)' }}
                            >
                              <X className="w-2.5 h-2.5" style={{ color: 'var(--hub-text-sub)' }} />
                            </button>
                          </div>
                        ))}

                        {extraPlayerCount > 0 && (
                          <div
                            className="inline-flex items-center px-2.5 py-1 rounded-full"
                            style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                          >
                            <span className="text-[12px]" style={{ color: 'var(--hub-text-dim)' }}>
                              +{extraPlayerCount} more
                            </span>
                          </div>
                        )}

                        {/* Add chip */}
                        <button
                          onClick={handleAddPlayers}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors active:opacity-70"
                          style={{
                            border: '1px dashed rgba(0, 0, 0, 0.12)',
                          }}
                        >
                          <Plus className="w-3 h-3" style={{ color: 'var(--hub-text-dim)' }} />
                          <span className="text-[12px]" style={{ color: 'var(--hub-text-dim)' }}>
                            Add
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* VISIBILITY + SLOTS - inline chips, no card wrapper */}
                <div className="py-2.5 space-y-3">
                  {/* Visibility */}
                  <div>
                    <span 
                      className="text-[11px] font-medium mb-2 block"
                      style={{ color: 'var(--hub-text-dim)', opacity: 0.7 }}
                    >
                      Visibility
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {visibilityOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            haptic('light');
                            setVisibility(option.value);
                          }}
                          className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-all"
                          style={{
                            background: visibility === option.value 
                              ? 'rgba(0, 0, 0, 0.08)' 
                              : 'rgba(0, 0, 0, 0.03)',
                            color: visibility === option.value 
                              ? 'var(--hub-text)' 
                              : 'var(--hub-text-muted)',
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slots (Game only) - small pill buttons */}
                  {mode === 'game' && (
                    <div>
                      <span 
                        className="text-[11px] font-medium mb-2 block"
                        style={{ color: 'var(--hub-text-dim)', opacity: 0.7 }}
                      >
                        Slots
                      </span>
                      <div className="flex gap-1.5">
                        {SLOT_OPTIONS.map(num => (
                          <button
                            key={num}
                            onClick={() => {
                              haptic('light');
                              setSlots(num);
                            }}
                            className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-all"
                            style={{
                              background: slots === num 
                                ? 'rgba(0, 0, 0, 0.08)' 
                                : 'rgba(0, 0, 0, 0.03)',
                              color: slots === num 
                                ? 'var(--hub-text)' 
                                : 'var(--hub-text-muted)',
                            }}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Single divider before optional details */}
                <div 
                  className="h-px my-1"
                  style={{ background: 'rgba(0, 0, 0, 0.05)' }}
                />

                {/* Optional details - subtle expansion row */}
                <div>
                  <button
                    onClick={() => {
                      haptic('light');
                      setShowDetails(!showDetails);
                    }}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <span 
                      className="text-[14px]"
                      style={{ color: 'var(--hub-text-sub)' }}
                    >
                      Add details (optional)
                    </span>
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        showDetails && "rotate-180"
                      )}
                      style={{ color: 'var(--hub-text-dim)', opacity: 0.5 }}
                    />
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
                        <div className="pt-2 pb-1 space-y-2.5">
                          {mode === 'game' ? (
                            <>
                              {/* Date & Time */}
                              <div className="flex gap-2">
                                <button
                                  className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-left"
                                  style={{ background: 'rgba(0, 0, 0, 0.03)' }}
                                >
                                  <Calendar className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                                  <span 
                                    className="text-[13px]"
                                    style={{ color: gameDate ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                                  >
                                    {gameDate ? format(gameDate, 'MMM d') : 'Date'}
                                  </span>
                                </button>
                                <button
                                  className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-left"
                                  style={{ background: 'rgba(0, 0, 0, 0.03)' }}
                                >
                                  <Clock className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                                  <span 
                                    className="text-[13px]"
                                    style={{ color: gameTime ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                                  >
                                    {gameTime || 'Time'}
                                  </span>
                                </button>
                              </div>

                              {/* Holes - inline chips */}
                              <div className="flex gap-1.5">
                                {([9, 18] as const).map(num => (
                                  <button
                                    key={num}
                                    onClick={() => {
                                      haptic('light');
                                      setHoleCount(num);
                                    }}
                                    className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all"
                                    style={{
                                      background: holeCount === num 
                                        ? 'rgba(0, 0, 0, 0.08)' 
                                        : 'rgba(0, 0, 0, 0.03)',
                                      color: holeCount === num 
                                        ? 'var(--hub-text)' 
                                        : 'var(--hub-text-muted)',
                                    }}
                                  >
                                    {num} holes
                                  </button>
                                ))}
                              </div>

                              {/* Game type - inline chips */}
                              <div className="flex gap-1.5">
                                {(['casual', 'practice', 'match'] as const).map(type => (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      haptic('light');
                                      setGameType(type);
                                    }}
                                    className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-all capitalize"
                                    style={{
                                      background: gameType === type 
                                        ? 'rgba(0, 0, 0, 0.08)' 
                                        : 'rgba(0, 0, 0, 0.03)',
                                      color: gameType === type 
                                        ? 'var(--hub-text)' 
                                        : 'var(--hub-text-muted)',
                                    }}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : (
                            /* Trip dates */
                            <div className="flex gap-2">
                              <button
                                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-left"
                                style={{ background: 'rgba(0, 0, 0, 0.03)' }}
                              >
                                <Calendar className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                                <span 
                                  className="text-[13px]"
                                  style={{ color: tripStartDate ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                                >
                                  {tripStartDate ? format(tripStartDate, 'MMM d') : 'Start'}
                                </span>
                              </button>
                              <button
                                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-left"
                                style={{ background: 'rgba(0, 0, 0, 0.03)' }}
                              >
                                <Calendar className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                                <span 
                                  className="text-[13px]"
                                  style={{ color: tripEndDate ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                                >
                                  {tripEndDate ? format(tripEndDate, 'MMM d') : 'End'}
                                </span>
                              </button>
                            </div>
                          )}

                          {/* Notes */}
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl text-[13px] resize-none"
                            style={{
                              background: 'rgba(0, 0, 0, 0.03)',
                              color: 'var(--hub-text)',
                              outline: 'none',
                              border: 'none',
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Sticky CTA - soft glass fade, premium button */}
            <div 
              className="absolute bottom-0 left-0 right-0 z-20"
              style={{ 
                background: 'linear-gradient(180deg, rgba(245, 245, 245, 0) 0%, rgba(245, 245, 245, 1) 30%)',
                padding: '24px 20px 12px 20px',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Validation hint - subtle */}
              {!isValid && (
                <p 
                  className="text-[12px] mb-2"
                  style={{ color: 'var(--hub-text-dim)', opacity: 0.7 }}
                >
                  Choose a course to continue
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="w-full py-3 rounded-2xl text-[15px] font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: isValid 
                    ? 'linear-gradient(135deg, #6E9277 0%, #7FA888 100%)'
                    : 'rgba(0, 0, 0, 0.04)',
                  color: isValid ? 'white' : 'var(--hub-text-muted)',
                  boxShadow: isValid ? '0 2px 12px rgba(110, 146, 119, 0.2)' : 'none',
                  opacity: isSubmitting ? 0.7 : (isValid ? 1 : 0.8),
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
