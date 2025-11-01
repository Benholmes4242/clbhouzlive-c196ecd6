import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, AlertCircle } from 'lucide-react';
import { GameBeacon } from '../hooks/useGameBeacon';
import { useCourseSearch } from '../hooks/useCourseSearch';
import { DateTimePicker } from './DateTimePicker';
import { UserSearchTypeahead } from './UserSearchTypeahead';
import { GameVisibilitySelector } from './GameVisibilitySelector';
import type { GameVisibility } from '../types';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { TapButton } from '@/components/ui/TapButton';

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
  onCancelBeacon: (beaconId: string) => Promise<void>;
  myBeacon: GameBeacon | null;
  prefilledClub?: { id: string; name: string };
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
  onCancelBeacon,
  myBeacon,
  prefilledClub,
}: CreateGameModalProps) {
  const [gameType, setGameType] = useState<string>('9_holes');
  const [courseId, setCourseId] = useState<string>('');
  const [courseName, setCourseName] = useState('');
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [note, setNote] = useState('');
  const [visibility, setVisibility] = useState<GameVisibility>('public');
  const [timing, setTiming] = useState<string>('now');
  const [customDateTime, setCustomDateTime] = useState<Date | null>(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [courseError, setCourseError] = useState<string>('');
  const courseInputRef = useRef<HTMLInputElement>(null);
  
  const { courses } = useCourseSearch(courseSearchTerm);

  // Calculate current players (host + tagged)
  const currentPlayers = 1 + selectedUsers.length;
  
  // Calculate max available slots based on current players
  const maxAvailableSlots = 4 - currentPlayers;
  
  // Get game size label
  const gameSizeLabels = ['One-ball', 'Two-ball', 'Three-ball', 'Four-ball'];
  const gameSizeLabel = currentPlayers <= 4 ? `${gameSizeLabels[currentPlayers - 1]} game` : 'Full game';

  // Pre-fill club if provided
  useEffect(() => {
    if (prefilledClub && !courseId) {
      setCourseId(prefilledClub.id);
      setCourseName(prefilledClub.name);
      setCourseSearchTerm('');
    }
  }, [prefilledClub, courseId]);

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
      setCourseSearchTerm('');
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
      setShowDateTimePicker(true);
    }
  };

  const handleCourseSelect = (course: { id: string; name: string }) => {
    setCourseId(course.id);
    setCourseName(course.name);
    setCourseSearchTerm(''); // Clear search buffer
    setShowCourseDropdown(false);
    setCourseError('');
    courseInputRef.current?.blur(); // Optional blur
  };

  const handleCourseInputChange = (value: string) => {
    setCourseSearchTerm(value);
    // If user types again, clear the courseId (treat as new search)
    if (courseId) {
      setCourseId('');
      setCourseName('');
    }
    setShowCourseDropdown(true);
    setCourseError('');
  };

  const getTimingDisplay = () => {
    if (timing === 'choose' && customDateTime) {
      return format(customDateTime, "MMM d 'at' h:mm a");
    }
    return TIMING_OPTIONS.find(opt => opt.value === timing)?.label || 'Now';
  };

  const handleCancel = async () => {
    if (!myBeacon) return;
    setIsSubmitting(true);
    try {
      await onCancelBeacon(myBeacon.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
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
        <div className="px-5 pt-4 pb-4">
          {/* Title + Close */}
          <div className="grid grid-cols-3 items-center mb-3" style={{ userSelect: 'none' }}>
            {/* Left spacer */}
            <div />
            
            {/* Title */}
            <div className="text-center">
              <h2 className="text-white text-[17px] font-semibold">
                {myBeacon ? 'Your Game' : 'Create a Game'}
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
          <p className="text-[15px] text-white/70 text-center">
            {myBeacon ? 'Currently hosting' : 'Let nearby golfers know you\'re looking to play'}
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
          {myBeacon ? (
            // Show existing beacon
            <div className="space-y-4">
              <div className="bg-neutral-800/50 rounded-xl p-4 space-y-3">
                {myBeacon.course_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Location</span>
                    <span className="text-sm font-medium text-neutral-200">{myBeacon.course_name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Seats</span>
                  <span className="text-sm font-medium text-neutral-200">
                    {myBeacon.slots_total - myBeacon.slots_open}/{myBeacon.slots_total} filled
                  </span>
                </div>
                {myBeacon.note && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-neutral-400">Note</span>
                    <span className="text-sm text-neutral-200">{myBeacon.note}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-700/50">
                  <span className="text-sm text-neutral-400">Expires in</span>
                  <span className="text-sm font-medium text-white/90">{getTimeRemaining(myBeacon.expires_at)}</span>
                </div>
              </div>
              
              <TapButton
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Cancelling...' : 'Cancel Game'}
              </TapButton>
            </div>
          ) : (
            // Create new beacon form
            <>
              {/* Game Type */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/90">
                  Game type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GAME_TYPES.map(type => (
                    <TapButton
                      key={type.value}
                      onClick={() => setGameType(type.value)}
                      className={`py-3 px-4 rounded-xl font-medium transition-all backdrop-blur ${
                        gameType === type.value
                          ? 'bg-white/20 text-white border border-white/28 shadow-[0_20px_48px_rgba(0,0,0,0.9),_0_0_30px_rgba(255,255,255,0.18)_inset] active:bg-white/30 active:shadow-[0_24px_54px_rgba(0,0,0,0.9),_0_0_40px_rgba(255,255,255,0.28)_inset]'
                          : 'bg-white/5 text-white/70 border border-white/12 shadow-[0_8px_24px_rgba(0,0,0,0.8)] hover:bg-white/10'
                      }`}
                    >
                      {type.label}
                    </TapButton>
                  ))}
                </div>
              </div>

              {/* Golf course */}
              <div className="space-y-3 relative">
                <label className="block text-sm font-medium text-white/90">
                  Golf course *
                </label>
                <input
                  ref={courseInputRef}
                  type="text"
                  placeholder="Search club name…"
                  value={courseName || courseSearchTerm}
                  onChange={(e) => handleCourseInputChange(e.target.value)}
                  onFocus={() => setShowCourseDropdown(true)}
                  className={`w-full py-3 px-4 bg-neutral-800 border rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 ${
                    courseError ? 'border-red-500' : 'border-neutral-700'
                  }`}
                />
                {courseName && courseId && (
                  <div className="text-xs text-white/50">
                    Selected: {courseName}
                  </div>
                )}
                {courseError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {courseError}
                  </div>
                )}
                {showCourseDropdown && courses.length > 0 && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowCourseDropdown(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto backdrop-blur-xl">
                      {courses.map((course) => (
                        <TapButton
                          key={course.id}
                          onClick={() => handleCourseSelect(course)}
                          className="w-full text-left px-4 py-3 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0"
                        >
                          <div className="text-white text-sm font-medium">{course.name}</div>
                          {course.region && (
                            <div className="text-white/60 text-xs mt-0.5">
                              {course.region}, {course.country}
                            </div>
                          )}
                        </TapButton>
                      ))}
                    </div>
                  </>
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
                <div className="grid grid-cols-4 gap-2">
                  {TIMING_OPTIONS.map(option => (
                    <TapButton
                      key={option.value}
                      onClick={() => handleTimingChange(option.value)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all backdrop-blur ${
                        timing === option.value
                          ? 'bg-white/20 text-white border border-white/28 shadow-[0_20px_48px_rgba(0,0,0,0.9),_0_0_30px_rgba(255,255,255,0.18)_inset] active:bg-white/30 active:shadow-[0_24px_54px_rgba(0,0,0,0.9),_0_0_40px_rgba(255,255,255,0.28)_inset]'
                          : 'bg-white/5 text-white/70 border border-white/12 shadow-[0_8px_24px_rgba(0,0,0,0.8)] hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                    </TapButton>
                  ))}
                </div>
                {timing === 'choose' && customDateTime && (
                  <div className="text-sm text-white/80 text-center mt-2">
                    {getTimingDisplay()}
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
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(num => {
                      const isDisabled = num > maxAvailableSlots;
                      return (
                        <TapButton
                          key={num}
                          onClick={() => !isDisabled && setAvailableSlots(num)}
                          disabled={isDisabled}
                          className={`py-3 px-4 rounded-xl font-medium transition-all backdrop-blur ${
                            availableSlots === num && !isDisabled
                              ? 'bg-white/20 text-white border border-white/28 shadow-[0_20px_48px_rgba(0,0,0,0.9),_0_0_30px_rgba(255,255,255,0.18)_inset]'
                              : isDisabled
                              ? 'bg-white/5 text-white/30 border border-white/8 cursor-not-allowed'
                              : 'bg-white/5 text-white/70 border border-white/12 hover:bg-white/10'
                          }`}
                        >
                          {num}
                        </TapButton>
                      );
                    })}
                  </div>
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
                disabled={!gameType || isSubmitting}
                className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 active:bg-white/30 text-white rounded-xl font-medium backdrop-blur border border-white/28 shadow-[0_20px_48px_rgba(0,0,0,0.9),_0_0_30px_rgba(255,255,255,0.18)_inset] active:shadow-[0_24px_54px_rgba(0,0,0,0.9),_0_0_40px_rgba(255,255,255,0.28)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Start Game'}
              </TapButton>
            </>
          )}
        </div>
      </div>

      {showDateTimePicker && (
        <DateTimePicker
          value={customDateTime}
          onChange={setCustomDateTime}
          onClose={() => setShowDateTimePicker(false)}
        />
      )}
    </div>
  );
}

