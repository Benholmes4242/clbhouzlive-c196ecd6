import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, AlertCircle } from 'lucide-react';
import { GameBeacon } from '../hooks/useGameBeacon';
import { SmartSearchInput } from '@/components/games/SmartSearchInput';
import { UserSearchTypeahead } from './UserSearchTypeahead';
import { GameVisibilitySelector } from './GameVisibilitySelector';
import { Segmented } from './Segmented';
import { Chip } from './Chip';
import { Token } from './Token';
import type { GameVisibility } from '../types';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { TapButton } from '@/components/ui/TapButton';
import { openCalendarPicker } from './CalendarPicker';
import { openTimePicker } from './TimePicker';
import './CreateGame.css';

// Format game type for display
function formatGameTypeDisplay(gameType: string): string {
  const typeMap: Record<string, string> = {
    '9_holes': '9 holes',
    '18_holes': '18 holes',
    'casual_golf': 'Casual golf',
    'practice': 'Practice',
  };
  return typeMap[gameType] || gameType;
}

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBeacon: (input: {
    game_type: string;
    course_name?: string;
    course_id?: string;
    note?: string;
    start_time?: string;
    players_needed?: number;
    tee_time?: string;
    slots_total?: number;
    tagged_user_ids?: string[];
    guest_participants?: Array<{ guest_name: string }>;
    visibility?: GameVisibility;
  }) => Promise<void>;
  prefilledClub?: { id: string; name: string };
  portalContainer?: HTMLElement | null;
}

interface ValidationErrors {
  slotsTotal?: string;
  startTime?: string;
  expiresAt?: string;
}

const GAME_TYPES = [
  { value: '9_holes', label: '9 holes' },
  { value: '18_holes', label: '18 holes' },
  { value: 'casual_golf', label: 'Casual golf' },
  { value: 'practice', label: 'Practice' },
];

const TIMING_OPTIONS = [
  { value: 'now', label: 'Now' },
  { value: '30', label: 'In 30 mins' },
  { value: '60', label: 'In 1 hour' },
  { value: 'choose', label: 'Choose' },
];

const PLAYERS_OPTIONS = [1, 2, 3];
const SLOTS_TOTAL_OPTIONS = [2, 3, 4]; // Common golf game sizes

export function CreateGameModal({
  isOpen,
  onClose,
  onCreateBeacon,
  prefilledClub,
  portalContainer,
}: CreateGameModalProps) {
  const [gameType, setGameType] = useState<string>('9_holes');
  const [courseId, setCourseId] = useState<string>('');
  const [courseName, setCourseName] = useState('');
  const [selectedClub, setSelectedClub] = useState<{ id: string; name: string } | null>(null);
  const [note, setNote] = useState('');
  const [visibility, setVisibility] = useState<GameVisibility>('public');
  const [timing, setTiming] = useState<string>('now');
  const [customDateTime, setCustomDateTime] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [courseError, setCourseError] = useState<string>('');

  // Calculate current players (host + tagged)
  const currentPlayers = 1 + selectedUsers.length;
  
  // Calculate max available slots based on current players
  const maxAvailableSlots = 4 - currentPlayers;
  
  // Get game size label
  const gameSizeLabels = ['One-ball', 'Two-ball', 'Three-ball', 'Four-ball'];
  const gameSizeLabel = currentPlayers <= 4 ? `${gameSizeLabels[currentPlayers - 1]} game` : 'Full game';

  // Pre-fill club if provided
  useEffect(() => {
    if (prefilledClub) {
      setCourseId(prefilledClub.id);
      setCourseName(prefilledClub.name);
      setSelectedClub({ id: prefilledClub.id, name: prefilledClub.name });
    }
  }, [prefilledClub]);

  // Adjust available slots if currentPlayers changes
  useEffect(() => {
    if (availableSlots > maxAvailableSlots) {
      setAvailableSlots(Math.max(1, maxAvailableSlots));
    }
  }, [currentPlayers, maxAvailableSlots, availableSlots]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validate course selection (must have courseId)
    if (!courseId) {
      setCourseError('Please pick a club from the list.');
      isValid = false;
    } else {
      setCourseError('');
    }

    // Validate start_time is in the future
    let startTime: Date;
    if (timing === 'now') {
      startTime = new Date();
    } else if (timing === '30') {
      startTime = new Date(Date.now() + 30 * 60 * 1000);
    } else if (timing === '60') {
      startTime = new Date(Date.now() + 60 * 60 * 1000);
    } else if (timing === 'choose' && customDateTime) {
      startTime = customDateTime;
      if (startTime.getTime() < Date.now()) {
        errors.startTime = 'Start time must be in the future';
        isValid = false;
      }
    } else {
      startTime = new Date();
    }

    // Validate total doesn't exceed 4
    const totalSlots = currentPlayers + availableSlots;
    if (totalSlots > 4) {
      errors.slotsTotal = `Total cannot exceed 4 players`;
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!gameType) return;
    if (!validateForm()) return;

    // Calculate start_time based on timing selection
    let startTime: Date;
    if (timing === 'now') {
      startTime = new Date();
    } else if (timing === '30') {
      startTime = new Date(Date.now() + 30 * 60 * 1000);
    } else if (timing === '60') {
      startTime = new Date(Date.now() + 60 * 60 * 1000);
    } else if (timing === 'choose' && customDateTime) {
      startTime = customDateTime;
    } else {
      startTime = new Date();
    }

    setIsSubmitting(true);
    try {
      const totalSlots = currentPlayers + availableSlots;
      
      // Separate users and guests
      const taggedUserIds = selectedUsers.filter(u => !u.guest_name).map(u => u.id);
      const guestParticipants = selectedUsers
        .filter(u => u.guest_name)
        .map(u => ({ guest_name: u.guest_name! }));
      
      await onCreateBeacon({
        game_type: gameType,
        course_id: courseId,
        course_name: courseName,
        note: note || undefined,
        visibility,
        start_time: startTime.toISOString(),
        tee_time: startTime.toISOString(),
        slots_total: totalSlots,
        tagged_user_ids: taggedUserIds.length > 0 ? taggedUserIds : undefined,
        guest_participants: guestParticipants.length > 0 ? guestParticipants : undefined,
      });
      
      // Reset form after successful creation
      setGameType('9_holes');
      setCourseId('');
      setCourseName('');
      setSelectedClub(null);
      setNote('');
      setVisibility('public');
      setTiming('now');
      setCustomDateTime(null);
      setAvailableSlots(3);
      setSelectedUsers([]);
      setValidationErrors({});
      setCourseError('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimingChange = (value: string) => {
    setTiming(value);
    if (value === 'choose') {
      openCustomTimePicker();
    }
  };

  const openCustomTimePicker = () => {
    openCalendarPicker({
      initialDate: customDateTime || new Date(),
      onSelect: (date) => {
        setCustomDateTime(date);
        setTiming('choose');
        // Then open time picker
        openTimePicker({
          initial: customDateTime ? format(customDateTime, 'HH:mm') : '08:00',
          onSelect: (time) => {
            const [hours, minutes] = time.split(':');
            const newDate = new Date(date);
            newDate.setHours(parseInt(hours), parseInt(minutes));
            setCustomDateTime(newDate);
          }
        });
      }
    });
  };


  const getTimingDisplay = () => {
    if (timing === 'choose' && customDateTime) {
      return format(customDateTime, "MMM d • h:mm a");
    }
    return TIMING_OPTIONS.find(opt => opt.value === timing)?.label || 'Now';
  };


  return (
    <div 
      className="fixed inset-0 flex items-end sm:items-center sm:justify-center animate-fade-in"
      style={{ 
        zIndex: 10000, // Above NearbyOverlay's z-9999
        backgroundColor: 'rgba(0,0,0,0)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        overscrollBehavior: 'none',
        pointerEvents: 'auto', // Changed from touchAction: 'none' to allow interaction
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        style={{ 
          height: 'calc(100vh - env(safe-area-inset-top))',
          maxHeight: '100vh',
          pointerEvents: 'auto',
          overscrollBehavior: 'contain',
          background: 'rgba(15, 15, 15, 0.75)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '0',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-5">
          {/* Title + Close */}
          <div className="grid grid-cols-3 items-center mb-3" style={{ userSelect: 'none' }}>
            {/* Left spacer */}
            <div />
            
            {/* Title */}
            <div className="text-center">
              <h2 className="text-white text-[17px] font-semibold">
                Create a Game
              </h2>
            </div>
            
            {/* Close button */}
            <div className="flex justify-end">
              <TapButton
                onClick={onClose}
                className="text-white/60 hover:text-white/90 transition-colors active:scale-95 w-11 h-11 flex items-center justify-center -mr-2"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </TapButton>
            </div>
          </div>
          
          {/* Subtitle */}
          <p className="text-[15px] text-white/70 text-center mt-4">
            Let nearby golfers know you're looking to play
          </p>
        </div>

        {/* Divider */}
        <div className="w-full" style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto px-5 pt-4 pb-6"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {/* Create new beacon form */}
          <>
            {/* Game Type */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/90">
                  Game type *
                </label>
                <Segmented
                  ariaLabel="Game type"
                  columns={2}
                  items={GAME_TYPES}
                  value={gameType}
                  onChange={(v) => setGameType(String(v))}
                />
              </div>

              {/* Golf course */}
              <div className="space-y-3">
                <SmartSearchInput
                  selectedClub={selectedClub ?? (courseId && courseName ? { id: courseId, name: courseName } : null)}
                  onCourseSelect={(club) => {
                    setCourseId(club.id);
                    setCourseName(club.name);
                    setSelectedClub({ id: club.id, name: club.name });
                    setCourseError('');
                  }}
                  onClear={() => {
                    setCourseId('');
                    setCourseName('');
                    setSelectedClub(null);
                  }}
                  headerText="Host a game at"
                  subtitleText="Search golf clubs to host your game"
                  selectedPrefix="Hosting at"
                  container={portalContainer}
                />
                {courseError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {courseError}
                  </div>
                )}
              </div>

              {/* Note */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/60">
                  Note
                </label>
                <textarea
                  placeholder="2 spots free, off 12hcp, casual vibes"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full py-3 px-4 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                />
              </div>

              {/* Visibility */}
              <div className="space-y-3">
                <GameVisibilitySelector
                  value={visibility}
                  onChange={setVisibility}
                />
              </div>

              {/* Timing */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/60">
                  When
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {TIMING_OPTIONS.map(option => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      active={timing === option.value}
                      onClick={() => handleTimingChange(option.value)}
                    />
                  ))}
                </div>
                {timing === 'choose' && customDateTime && (
                  <div className="text-sm text-white/80 text-center mt-2">
                    Selected • {getTimingDisplay()}
                  </div>
                )}
              </div>

              {/* Tag Players */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-white/60">
                    Tag players (optional)
                  </label>
                  <div className="text-xs text-white/50">
                    {gameSizeLabel}
                  </div>
                </div>
                <UserSearchTypeahead
                  selectedUsers={selectedUsers}
                  onUserAdd={(user) => setSelectedUsers([...selectedUsers, user])}
                  onUserRemove={(userId) => setSelectedUsers(selectedUsers.filter(u => u.id !== userId))}
                  maxUsers={3} // Max 3 tagged (host + 3 = 4 total)
                />
              </div>

              {/* Available Slots */}
              {maxAvailableSlots > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-white/90">
                    Available slots *
                  </label>
                  <Segmented
                    ariaLabel="Available slots"
                    columns={3}
                    items={[1, 2, 3].map(num => ({
                      value: num,
                      label: String(num),
                      disabled: num > maxAvailableSlots
                    }))}
                    value={availableSlots}
                    onChange={(v) => setAvailableSlots(Number(v))}
                  />
                  <div className="text-xs text-center text-white/60">
                    {availableSlots === 1 ? '1 slot available' : `${availableSlots} slots available`}
                  </div>
                  {validationErrors.slotsTotal && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.slotsTotal}
                    </div>
                  )}
                </div>
              )}

              {/* Timing validation error */}
              {validationErrors.startTime && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.startTime}
                </div>
              )}

              <TapButton
                onClick={handleSubmit}
                disabled={!gameType || !courseId || isSubmitting}
                className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 active:bg-white/30 text-white rounded-xl font-medium backdrop-blur border border-white/28 shadow-[0_20px_48px_rgba(0,0,0,0.9),_0_0_30px_rgba(255,255,255,0.18)_inset] active:shadow-[0_24px_54px_rgba(0,0,0,0.9),_0_0_40px_rgba(255,255,255,0.28)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ height: '52px' }}
              >
                {isSubmitting ? 'Starting…' : 'Start Game'}
              </TapButton>
            </>
        </div>
      </div>
    </div>
  );
}

