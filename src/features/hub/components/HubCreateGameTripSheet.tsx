/**
 * HubCreateGameTripSheet - World-class composer for creating games/trips
 * 
 * WhatsApp/iMessage composer aesthetic
 * Apple/Strava-level: clean hierarchy, subtle delight
 * Matches Hub + Games & Trips sheet surfaces
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Users, Calendar, Clock, Plus, ChevronDown, Plane, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { CourseSearchSheet } from '@/components/courses/CourseSearchSheet';
import { UserSearchTypeahead } from '@/features/nearby/components/UserSearchTypeahead';
import '../home/hubThemeLight.css';

type SheetMode = 'game' | 'trip';
type Visibility = 'public' | 'friends' | 'club' | 'private' | 'invite';

interface SelectedCourse {
  id: string;
  name: string;
  location?: string;
  thumbnail_image?: string;
}

interface SelectedPlayer {
  id: string;
  name: string;
  display_name?: string;
  profile_photo_url?: string;
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

const MAX_PLAYERS = 4;

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
  
  // Separate expanded states per mode (bug fix)
  const [showDetailsGame, setShowDetailsGame] = useState(false);
  const [showDetailsTrip, setShowDetailsTrip] = useState(false);
  
  // Game details
  const [gameDate, setGameDate] = useState<Date | null>(null);
  const [gameTime, setGameTime] = useState<string>('');
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [gameType, setGameType] = useState<'casual' | 'practice' | 'match'>('casual');
  const [notes, setNotes] = useState('');
  
  // Trip details
  const [tripStartDate, setTripStartDate] = useState<Date | null>(null);
  const [tripEndDate, setTripEndDate] = useState<Date | null>(null);
  const [tripNotes, setTripNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sub-sheet states
  const [courseSearchOpen, setCourseSearchOpen] = useState(false);
  const [playerPickerOpen, setPlayerPickerOpen] = useState(false);

  // Get correct show details state for current mode
  const showDetails = mode === 'game' ? showDetailsGame : showDetailsTrip;
  const setShowDetails = mode === 'game' ? setShowDetailsGame : setShowDetailsTrip;

  // Reset form when sheet opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedCourse(null);
      setSelectedPlayers([]);
      setVisibility(initialMode === 'trip' ? 'invite' : 'friends');
      setShowDetailsGame(false);
      setShowDetailsTrip(false);
      setGameDate(null);
      setGameTime('');
      setHoleCount(18);
      setGameType('casual');
      setNotes('');
      setTripStartDate(null);
      setTripEndDate(null);
      setTripNotes('');
    }
  }, [isOpen, initialMode]);

  // Scroll-lock - lock hub behind
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;

    if (isOpen && !wasOpenRef.current) {
      rootScrollTopRef.current = rootEl.scrollTop;
      rootEl.style.overflow = 'hidden';
      rootEl.style.height = '100svh';
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      rootEl.style.overflow = '';
      rootEl.style.height = '';
      rootEl.scrollTop = rootScrollTopRef.current;
      wasOpenRef.current = false;
    }

    return () => {
      if (wasOpenRef.current) {
        rootEl.style.overflow = '';
        rootEl.style.height = '';
        rootEl.scrollTop = rootScrollTopRef.current;
        wasOpenRef.current = false;
      }
    };
  }, [isOpen]);

  const handleSheetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleModeChange = (newMode: SheetMode) => {
    if (newMode === mode) return;
    haptic('light');
    setMode(newMode);
    // Reset mode-specific fields
    setSelectedCourse(null);
    setSelectedPlayers([]);
    setVisibility(newMode === 'trip' ? 'invite' : 'friends');
  };

  const visibilityOptions = mode === 'game' ? GAME_VISIBILITY_OPTIONS : TRIP_VISIBILITY_OPTIONS;

  // Players count (creator counts as 1)
  const currentPlayers = 1 + selectedPlayers.length;

  const isValid = useMemo(() => {
    return !!selectedCourse;
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
        currentPlayers,
        date: mode === 'game' ? gameDate : tripStartDate,
        endDate: mode === 'trip' ? tripEndDate : undefined,
        time: mode === 'game' ? gameTime : undefined,
        holeCount: mode === 'game' ? holeCount : undefined,
        gameType: mode === 'game' ? gameType : undefined,
        notes: mode === 'game' ? notes : tripNotes,
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

  // Course selection from search sheet
  const handleCourseSelect = (course: {
    id: string;
    name: string;
    country: string;
    sub_country?: string;
    thumbnail_image?: string;
  }) => {
    haptic('light');
    setSelectedCourse({
      id: course.id,
      name: course.name,
      location: course.sub_country || course.country,
      thumbnail_image: course.thumbnail_image,
    });
    setCourseSearchOpen(false);
  };

  // Add player (prevent duplicates)
  const handleAddPlayer = (user: SelectedPlayer) => {
    if (selectedPlayers.some(p => p.id === user.id)) return;
    if (selectedPlayers.length >= MAX_PLAYERS - 1) return; // -1 because creator is player 1
    haptic('light');
    setSelectedPlayers(prev => [...prev, user]);
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/25 z-[10003]"
            style={{ touchAction: 'none' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10004] rounded-t-[28px] overflow-hidden flex flex-col"
            style={{
              height: '78vh',
              background: 'linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08), 0 -1px 0 rgba(255, 255, 255, 0.5) inset',
              borderTop: '1px solid rgba(255, 255, 255, 0.8)',
              overscrollBehavior: 'contain',
            }}
            onClick={handleSheetClick}
          >
            {/* Header */}
            <div className="flex-shrink-0">
              {/* Drag handle */}
              <div className="flex justify-center pt-2.5 pb-1">
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
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-[0.96] active:opacity-80"
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.04)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
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
                    background: 'rgba(0, 0, 0, 0.04)',
                  }}
                >
                  {(['game', 'trip'] as SheetMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => handleModeChange(m)}
                      className="flex-1 px-4 py-2 rounded-xl text-[14px] font-medium transition-all capitalize active:scale-[0.98]"
                      style={{
                        background: mode === m ? 'rgba(255, 255, 255, 0.98)' : 'transparent',
                        border: mode === m ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid transparent',
                        color: mode === m ? 'var(--hub-text)' : 'var(--hub-text-muted)',
                        boxShadow: mode === m ? '0 2px 6px rgba(0, 0, 0, 0.04)' : 'none',
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
                paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))',
                overscrollBehavior: 'contain',
              }}
            >
              <div className="flex flex-col gap-3">
                
                {/* WHERE - Premium composer bar */}
                {selectedCourse ? (
                  <div 
                    className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(110, 146, 119, 0.15) 0%, rgba(110, 146, 119, 0.08) 100%)',
                      }}
                    >
                      <MapPin className="w-[18px] h-[18px]" style={{ color: 'var(--hub-accent)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium truncate" style={{ color: 'var(--hub-text)' }}>
                        {selectedCourse.name}
                      </div>
                      {selectedCourse.location && (
                        <div className="text-[12px] truncate" style={{ color: 'var(--hub-text-dim)' }}>
                          {selectedCourse.location}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setCourseSearchOpen(true)}
                      className="text-[13px] font-medium px-3 py-1.5 rounded-full transition-all active:scale-[0.96]"
                      style={{ 
                        color: 'var(--hub-accent)',
                        background: 'rgba(110, 146, 119, 0.08)',
                      }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      haptic('light');
                      setCourseSearchOpen(true);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.99] active:opacity-90"
                    style={{
                      background: mode === 'game' 
                        ? 'linear-gradient(135deg, rgba(110, 146, 119, 0.06) 0%, rgba(130, 166, 139, 0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(180, 130, 80, 0.06) 0%, rgba(200, 150, 100, 0.03) 100%)',
                      border: '1px solid rgba(0, 0, 0, 0.04)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ 
                        background: mode === 'game'
                          ? 'rgba(110, 146, 119, 0.1)'
                          : 'rgba(180, 130, 80, 0.1)',
                      }}
                    >
                      {mode === 'game' ? (
                        <MapPin className="w-[18px] h-[18px]" style={{ color: 'var(--hub-accent)' }} />
                      ) : (
                        <Plane className="w-[18px] h-[18px]" style={{ color: '#B4824F' }} />
                      )}
                    </div>
                    <span 
                      className="flex-1 text-[15px]"
                      style={{ color: 'var(--hub-text-sub)' }}
                    >
                      {mode === 'game' ? 'Choose a golf club' : 'Choose a base club or destination'}
                    </span>
                    <ChevronDown 
                      className="w-4 h-4 rotate-[-90deg]" 
                      style={{ color: 'var(--hub-text-dim)', opacity: 0.5 }} 
                    />
                  </button>
                )}

                {/* WHO - composer bar with chips */}
                <div 
                  className="p-3 rounded-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    border: '1px solid rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                    >
                      <Users className="w-[18px] h-[18px]" style={{ color: 'var(--hub-text-dim)' }} />
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-2">
                      {selectedPlayers.length === 0 ? (
                        <button
                          onClick={() => {
                            haptic('light');
                            setPlayerPickerOpen(true);
                          }}
                          className="text-[15px] transition-all active:opacity-70 flex items-center gap-2"
                          style={{ color: 'var(--hub-text-muted)' }}
                        >
                          <span>{mode === 'game' ? "Who's playing?" : "Who's attending?"}</span>
                          <Plus className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                        </button>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {displayedPlayers.map(player => (
                            <div
                              key={player.id}
                              className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full"
                              style={{
                                background: 'rgba(0, 0, 0, 0.05)',
                              }}
                            >
                              {player.profile_photo_url ? (
                                <img 
                                  src={player.profile_photo_url}
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              ) : (
                                <div 
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium"
                                  style={{ background: 'rgba(0, 0, 0, 0.08)', color: 'var(--hub-text-dim)' }}
                                >
                                  {(player.display_name || player.name || '?').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-[13px] font-medium" style={{ color: 'var(--hub-text)' }}>
                                {player.display_name || player.name}
                              </span>
                              <button
                                onClick={() => handleRemovePlayer(player.id)}
                                className="w-4 h-4 rounded-full flex items-center justify-center transition-colors"
                                style={{ background: 'rgba(0, 0, 0, 0.08)' }}
                              >
                                <X className="w-2.5 h-2.5" style={{ color: 'var(--hub-text-sub)' }} />
                              </button>
                            </div>
                          ))}

                          {extraPlayerCount > 0 && (
                            <button
                              onClick={() => setPlayerPickerOpen(true)}
                              className="inline-flex items-center px-2.5 py-1 rounded-full transition-colors active:opacity-70"
                              style={{ background: 'rgba(0, 0, 0, 0.05)' }}
                            >
                              <span className="text-[12px] font-medium" style={{ color: 'var(--hub-text-sub)' }}>
                                +{extraPlayerCount} more
                              </span>
                            </button>
                          )}

                          {/* Add chip - only show if we can add more */}
                          {(mode === 'trip' || selectedPlayers.length < MAX_PLAYERS - 1) && (
                            <button
                              onClick={() => {
                                haptic('light');
                                setPlayerPickerOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-all active:scale-[0.96]"
                              style={{
                                border: '1px dashed rgba(0, 0, 0, 0.15)',
                              }}
                            >
                              <Plus className="w-3 h-3" style={{ color: 'var(--hub-text-dim)' }} />
                              <span className="text-[12px]" style={{ color: 'var(--hub-text-dim)' }}>
                                Add
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* VISIBILITY + PLAYERS - inline section */}
                <div className="py-1 space-y-4">
                  {/* Visibility chips */}
                  <div>
                    <span 
                      className="text-[11px] font-medium mb-2 block uppercase tracking-wide"
                      style={{ color: 'var(--hub-text-dim)', opacity: 0.6 }}
                    >
                      Visibility
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {visibilityOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            haptic('light');
                            setVisibility(option.value);
                          }}
                          className="px-3.5 py-2 rounded-full text-[13px] font-medium transition-all active:scale-[0.96]"
                          style={{
                            background: visibility === option.value 
                              ? 'rgba(0, 0, 0, 0.08)' 
                              : 'rgba(255, 255, 255, 0.8)',
                            border: visibility === option.value
                              ? '1px solid rgba(0, 0, 0, 0.08)'
                              : '1px solid rgba(0, 0, 0, 0.04)',
                            color: visibility === option.value 
                              ? 'var(--hub-text)' 
                              : 'var(--hub-text-muted)',
                            boxShadow: visibility === option.value
                              ? '0 1px 4px rgba(0, 0, 0, 0.04)'
                              : 'none',
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Players counter (Game only) */}
                  {mode === 'game' && (
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-[13px]"
                        style={{ color: 'var(--hub-text-sub)' }}
                      >
                        Players
                      </span>
                      <div 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ 
                          background: 'rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        <span 
                          className="text-[13px] font-medium"
                          style={{ color: 'var(--hub-text)' }}
                        >
                          {currentPlayers}
                        </span>
                        <span 
                          className="text-[13px]"
                          style={{ color: 'var(--hub-text-dim)' }}
                        >
                          / {MAX_PLAYERS}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div 
                  className="h-px my-1"
                  style={{ background: 'rgba(0, 0, 0, 0.05)' }}
                />

                {/* Add details (optional) */}
                <div>
                  <button
                    onClick={() => {
                      haptic('light');
                      setShowDetails(!showDetails);
                    }}
                    className="w-full flex items-center justify-between py-2.5 text-left transition-all"
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
                        <div className="pt-2 pb-1 space-y-3">
                          {mode === 'game' ? (
                            <>
                              {/* Date & Time chips */}
                              <div className="flex gap-2">
                                <button
                                  className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-left transition-all active:scale-[0.98]"
                                  style={{ 
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    border: '1px solid rgba(0, 0, 0, 0.04)',
                                  }}
                                >
                                  <Calendar className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                                  <span 
                                    className="text-[13px] font-medium"
                                    style={{ color: gameDate ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                                  >
                                    {gameDate ? format(gameDate, 'MMM d') : 'Date'}
                                  </span>
                                </button>
                                <button
                                  className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-left transition-all active:scale-[0.98]"
                                  style={{ 
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    border: '1px solid rgba(0, 0, 0, 0.04)',
                                  }}
                                >
                                  <Clock className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                                  <span 
                                    className="text-[13px] font-medium"
                                    style={{ color: gameTime ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                                  >
                                    {gameTime || 'Time'}
                                  </span>
                                </button>
                              </div>

                              {/* Holes */}
                              <div className="flex gap-2">
                                {([9, 18] as const).map(num => (
                                  <button
                                    key={num}
                                    onClick={() => {
                                      haptic('light');
                                      setHoleCount(num);
                                    }}
                                    className="px-4 py-2 rounded-full text-[13px] font-medium transition-all active:scale-[0.96]"
                                    style={{
                                      background: holeCount === num 
                                        ? 'rgba(0, 0, 0, 0.08)' 
                                        : 'rgba(255, 255, 255, 0.8)',
                                      border: '1px solid rgba(0, 0, 0, 0.04)',
                                      color: holeCount === num 
                                        ? 'var(--hub-text)' 
                                        : 'var(--hub-text-muted)',
                                    }}
                                  >
                                    {num} holes
                                  </button>
                                ))}
                              </div>

                              {/* Game type */}
                              <div className="flex gap-2">
                                {(['casual', 'practice', 'match'] as const).map(type => (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      haptic('light');
                                      setGameType(type);
                                    }}
                                    className="px-4 py-2 rounded-full text-[13px] font-medium transition-all capitalize active:scale-[0.96]"
                                    style={{
                                      background: gameType === type 
                                        ? 'rgba(0, 0, 0, 0.08)' 
                                        : 'rgba(255, 255, 255, 0.8)',
                                      border: '1px solid rgba(0, 0, 0, 0.04)',
                                      color: gameType === type 
                                        ? 'var(--hub-text)' 
                                        : 'var(--hub-text-muted)',
                                    }}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>

                              {/* Notes */}
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes..."
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl text-[14px] resize-none"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.8)',
                                  border: '1px solid rgba(0, 0, 0, 0.04)',
                                  color: 'var(--hub-text)',
                                  outline: 'none',
                                }}
                              />
                            </>
                          ) : (
                            <>
                              {/* Trip dates */}
                              <div className="flex gap-2">
                                <button
                                  className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-left transition-all active:scale-[0.98]"
                                  style={{ 
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    border: '1px solid rgba(0, 0, 0, 0.04)',
                                  }}
                                >
                                  <Calendar className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                                  <span 
                                    className="text-[13px] font-medium"
                                    style={{ color: tripStartDate ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                                  >
                                    {tripStartDate ? format(tripStartDate, 'MMM d') : 'Start date'}
                                  </span>
                                </button>
                                <button
                                  className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-left transition-all active:scale-[0.98]"
                                  style={{ 
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    border: '1px solid rgba(0, 0, 0, 0.04)',
                                  }}
                                >
                                  <Calendar className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                                  <span 
                                    className="text-[13px] font-medium"
                                    style={{ color: tripEndDate ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                                  >
                                    {tripEndDate ? format(tripEndDate, 'MMM d') : 'End date'}
                                  </span>
                                </button>
                              </div>

                              {/* Trip notes */}
                              <textarea
                                value={tripNotes}
                                onChange={(e) => setTripNotes(e.target.value)}
                                placeholder="Add trip notes..."
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl text-[14px] resize-none"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.8)',
                                  border: '1px solid rgba(0, 0, 0, 0.04)',
                                  color: 'var(--hub-text)',
                                  outline: 'none',
                                }}
                              />
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Sticky CTA bar */}
            <div 
              className="absolute bottom-0 left-0 right-0 z-20"
              style={{ 
                background: 'linear-gradient(180deg, rgba(245, 245, 245, 0) 0%, rgba(245, 245, 245, 0.95) 20%, rgba(245, 245, 245, 1) 40%)',
                padding: '20px 20px 16px 20px',
                paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Hint text */}
              {!isValid && (
                <p 
                  className="text-[12px] text-center mb-3"
                  style={{ color: 'var(--hub-text-dim)' }}
                >
                  Choose a golf club to continue
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: isValid 
                    ? 'linear-gradient(135deg, #6E9277 0%, #7FA888 100%)'
                    : 'rgba(0, 0, 0, 0.06)',
                  color: isValid ? 'white' : 'var(--hub-text-muted)',
                  boxShadow: isValid ? '0 4px 16px rgba(110, 146, 119, 0.25)' : 'none',
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

          {/* Course Search Sheet */}
          <CourseSearchSheet
            isOpen={courseSearchOpen}
            onClose={() => setCourseSearchOpen(false)}
            onSelectCourse={handleCourseSelect}
          />

          {/* Player Picker - TODO: Replace with proper picker sheet */}
          <AnimatePresence>
            {playerPickerOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 z-[10005]"
                  onClick={() => setPlayerPickerOpen(false)}
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'tween', duration: 0.2 }}
                  className="fixed inset-x-0 bottom-0 z-[10006] rounded-t-[24px] p-5"
                  style={{
                    background: 'white',
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[17px] font-semibold" style={{ color: 'var(--hub-text)' }}>
                      Add Players
                    </h3>
                    <button
                      onClick={() => setPlayerPickerOpen(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0, 0, 0, 0.05)' }}
                    >
                      <X className="w-4 h-4" style={{ color: 'var(--hub-text-sub)' }} />
                    </button>
                  </div>
                  
                  <UserSearchTypeahead
                    selectedUsers={selectedPlayers.map(p => ({
                      id: p.id,
                      display_name: p.display_name || p.name,
                      profile_photo_url: p.profile_photo_url,
                    }))}
                    onUserAdd={(user) => {
                      handleAddPlayer({
                        id: user.id,
                        name: user.display_name || '',
                        display_name: user.display_name,
                        profile_photo_url: user.profile_photo_url,
                      });
                    }}
                    onUserRemove={(userId) => handleRemovePlayer(userId)}
                    maxUsers={mode === 'game' ? MAX_PLAYERS - 1 : 100}
                  />
                  
                  <button
                    onClick={() => setPlayerPickerOpen(false)}
                    className="w-full mt-4 py-3 rounded-xl text-[15px] font-medium"
                    style={{
                      background: 'var(--hub-accent)',
                      color: 'white',
                    }}
                  >
                    Done
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default HubCreateGameTripSheet;
