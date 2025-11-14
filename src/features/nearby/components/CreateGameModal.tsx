import React, { useState, useEffect } from 'react';
import { ChevronLeft, AlertCircle, Search, MapPin } from 'lucide-react';
import { useCourseSearch } from '../hooks/useCourseSearch';
import { UserSearchTypeahead } from './UserSearchTypeahead';
import { GameVisibilitySelector } from './GameVisibilitySelector';
import type { GameVisibility } from '../types';
import { format } from 'date-fns';
import { TapButton } from '@/components/ui/TapButton';
import { openCalendarPicker } from './CalendarPicker';
import { openTimePicker } from './TimePicker';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import './CreateGame.css';
import '../GamesTab.css';
import { Z } from '@/config/zIndex';

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
  hubMode?: boolean;
}

interface ValidationErrors {
  slotsTotal?: string;
  startTime?: string;
}

type PresetId = 'be_my_fourth' | 'practice_session' | 'money_match' | null;

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

export function CreateGameModal({
  isOpen,
  onClose,
  onCreateBeacon,
  prefilledClub,
  portalContainer,
  hubMode = false,
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
  
  // Course search state
  const [courseQuery, setCourseQuery] = useState('');
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const { courses, isLoading: isSearchingCourses } = useCourseSearch(courseQuery);

  // Remove preset state - feature removed per ticket

  // Calculate current players (host + tagged)
  const currentPlayers = 1 + selectedUsers.length;
  
  // Calculate max available slots based on current players
  const maxAvailableSlots = 4 - currentPlayers;

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

  // Preset handler removed per ticket

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    if (!courseId) {
      setCourseError('Please pick a club from the list.');
      isValid = false;
    } else {
      setCourseError('');
    }

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
    if (!validateForm()) {
      haptic('medium');
      return;
    }

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
    haptic('medium');
    
    try {
      const totalSlots = currentPlayers + availableSlots;
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
      
      // Reset form
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
      
      onClose();
    } catch (error) {
      console.error('Error creating beacon:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimingChange = (value: string) => {
    setTiming(value);
    haptic('light');
    
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
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const isToday = customDateTime.toDateString() === today.toDateString();
      const isTomorrow = customDateTime.toDateString() === tomorrow.toDateString();
      
      if (isToday) {
        return `Today • ${format(customDateTime, 'HH:mm')}`;
      } else if (isTomorrow) {
        return `Tomorrow • ${format(customDateTime, 'HH:mm')}`;
      } else {
        return format(customDateTime, "EEE dd MMM • HH:mm");
      }
    }
    return null;
  };

  const containerStyle = {
    background: 'rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(120px)',
    WebkitBackdropFilter: 'blur(120px)',
  };

  const modalStyle = hubMode ? {
    height: '100vh',
    maxHeight: '100vh',
    pointerEvents: 'auto' as const,
    overscrollBehavior: 'contain' as const,
    background: 'transparent',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    border: 'none',
    borderRadius: '0',
    boxShadow: 'none',
  } : {
    height: 'calc(100vh - env(safe-area-inset-top))',
    maxHeight: '100vh',
    pointerEvents: 'auto' as const,
    overscrollBehavior: 'contain' as const,
    background: 'transparent',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    border: 'none',
    borderRadius: '0',
    boxShadow: 'none',
  };

  const getTaggedPlayersSummary = () => {
    if (selectedUsers.length === 0) return null;
    if (selectedUsers.length === 1) return selectedUsers[0].username || selectedUsers[0].guest_name;
    if (selectedUsers.length === 2) {
      return `${selectedUsers[0].username || selectedUsers[0].guest_name}, ${selectedUsers[1].username || selectedUsers[1].guest_name}`;
    }
    return `${selectedUsers[0].username || selectedUsers[0].guest_name}, ${selectedUsers[1].username || selectedUsers[1].guest_name} +${selectedUsers.length - 2} more`;
  };

  return (
    <div 
      className="fixed inset-0 flex items-end sm:items-center sm:justify-center animate-fade-in"
      style={{ 
        zIndex: hubMode ? 9999 : Z.createGame,
        ...containerStyle,
        overscrollBehavior: 'none',
        pointerEvents: 'auto',
      }}
    >
      {!hubMode && (
        <div 
          className="absolute inset-0"
          onClick={onClose}
          style={{ pointerEvents: 'auto' }}
        />
      )}
      
      <div 
        className="relative w-full max-w-lg flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        style={{
          ...modalStyle,
          touchAction: 'pan-y',
          overflowX: 'hidden',
          minWidth: 0,
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 border-b"
          style={{
            borderColor: 'var(--hub-stroke)',
            background: 'rgba(22, 24, 27, 0.98)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            paddingTop: 'max(16px, env(safe-area-inset-top))',
          }}
        >
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-white/90 hover:text-white text-[15px] font-medium transition-colors -ml-1"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-white/90 text-[17px] font-semibold">Create a game</h1>
          <div className="w-16" />
        </header>

        <div 
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            overscrollBehaviorX: 'none',
            overflowX: 'hidden',
            paddingBottom: '120px',
          }}
        >
          <div className="px-4 pt-6 space-y-5">
            {/* Game Type - 2x2 Grid */}
            <div className="space-y-2">
              <label className="sectionLabel">Game type</label>
              <div className="grid grid-cols-2 gap-2">
                {GAME_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setGameType(type.value);
                      haptic('light');
                    }}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                      "border backdrop-blur-sm",
                      "active:scale-[0.97]",
                      gameType === type.value
                        ? "bg-white/[0.12] border-white/20 text-white shadow-sm"
                        : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]"
                    )}
                    style={{ letterSpacing: '0.2px' }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Golf course */}
            <div className="findBlock">
              {selectedClub ? (
                <div className="selectedClubRow">
                  <span className="prefix">Hosting at</span>
                  <div 
                    className="clubPill"
                    style={{
                      padding: '6px 10px 6px 14px',
                      borderColor: 'rgba(255, 255, 255, 0.18)',
                    }}
                  >
                    <span className="clubName">{selectedClub.name}</span>
                    <TapButton 
                      className="x" 
                      aria-label="Clear" 
                      onClick={() => {
                        haptic('light');
                        setCourseId('');
                        setCourseName('');
                        setSelectedClub(null);
                        setCourseQuery('');
                        setCourseError('');
                      }}
                      style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✕
                    </TapButton>
                  </div>
                </div>
              ) : (
                <>
                  <label className="findLabel">Host a game at</label>
                  <div className="searchBox" style={{ margin: 0 }}>
                    <Search className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                    <input
                      placeholder="Search golf club…"
                      value={courseQuery}
                      onChange={(e) => setCourseQuery(e.target.value)}
                      onFocus={() => setIsCourseDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsCourseDropdownOpen(false), 200)}
                    />
                  </div>
                  {isCourseDropdownOpen && courseQuery.length >= 2 && (
                    <div className="resultsSheet">
                      {isSearchingCourses ? (
                        <div className="hint">Searching...</div>
                      ) : courses.length === 0 ? (
                        <div className="hint">No clubs found</div>
                      ) : (
                        courses.map(c => (
                          <TapButton 
                            key={c.id} 
                            className="resultRow" 
                            onClick={() => {
                              haptic('light');
                              setCourseId(c.id);
                              setCourseName(c.name);
                              setSelectedClub({ id: c.id, name: c.name });
                              setCourseQuery('');
                              setIsCourseDropdownOpen(false);
                              setCourseError('');
                            }}
                          >
                            <MapPin className="w-4 h-4" style={{ color: 'white' }} />
                            <div className="rMid">
                              <div className="rTitle">{c.name}</div>
                              <div className="rSub">{c.region || c.country}</div>
                            </div>
                          </TapButton>
                        ))
                      )}
                    </div>
                  )}
                  {isCourseDropdownOpen && courseQuery.length > 0 && courseQuery.length < 2 && (
                    <div className="resultsSheet">
                      <div className="hint">Type at least 2 characters</div>
                    </div>
                  )}
                </>
              )}
              {courseError && (
                <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                  <AlertCircle className="w-4 h-4" />
                  {courseError}
                </div>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="sectionLabel">Note</label>
              <div 
                className="rounded-2xl p-4 backdrop-blur-sm border"
                style={{
                  background: 'var(--hub-glass-bg-card)',
                  borderColor: 'var(--hub-stroke)',
                }}
              >
                <textarea
                  placeholder="We are looking for a fourth player, casual round, money match – who's in?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full bg-transparent text-white/90 placeholder:text-white/40 focus:outline-none resize-none text-[15px] leading-relaxed"
                  style={{ minHeight: '80px', maxHeight: '160px' }}
                />
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <GameVisibilitySelector
                value={visibility}
                onChange={(v) => {
                  setVisibility(v);
                  haptic('light');
                }}
              />
            </div>

            {/* Timing */}
            <div className="space-y-2">
              <label className="sectionLabel">When</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {TIMING_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTimingChange(option.value)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                      "border backdrop-blur-sm flex items-center justify-center",
                      "active:scale-[0.97]",
                      timing === option.value
                        ? "bg-white/[0.12] border-white/20 text-white shadow-sm"
                        : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]"
                    )}
                    style={{ 
                      letterSpacing: '0.2px',
                      minHeight: '44px',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {timing === 'choose' && customDateTime && (
                <div className="helper mt-2 text-center">
                  {getTimingDisplay()}
                </div>
              )}
            </div>

            {/* Tag Players */}
            <div className="space-y-2">
              <label className="sectionLabel">Tag players (optional)</label>
              <UserSearchTypeahead
                selectedUsers={selectedUsers}
                onUserAdd={(user) => setSelectedUsers([...selectedUsers, user])}
                onUserRemove={(userId) => setSelectedUsers(selectedUsers.filter(u => u.id !== userId))}
                maxUsers={3}
              />
              {selectedUsers.length > 0 && (
                <div className="helper mt-1">
                  {getTaggedPlayersSummary()}
                </div>
              )}
            </div>

            {/* Available Slots */}
            {maxAvailableSlots > 0 && (
              <div className="space-y-2">
                <label className="sectionLabel">Available slots</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map(num => (
                    <button
                      key={num}
                      type="button"
                      disabled={num > maxAvailableSlots}
                      onClick={() => {
                        setAvailableSlots(num);
                        haptic('light');
                      }}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                        "border backdrop-blur-sm active:scale-[0.97]",
                        availableSlots === num
                          ? "bg-white/[0.14] border-white/[0.22] text-white shadow-lg"
                          : num > maxAvailableSlots
                          ? "bg-white/[0.02] border-white/[0.06] text-white/30 cursor-not-allowed"
                          : "bg-white/[0.04] border-white/[0.12] text-white/70 hover:bg-white/[0.08]"
                      )}
                      style={{
                        boxShadow: availableSlots === num ? '0 0 12px rgba(255, 255, 255, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.12)' : 'none',
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="helper text-center">
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

            {validationErrors.startTime && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.startTime}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer CTA */}
        <div 
          className="sticky bottom-0 left-0 right-0 px-4 pt-3 pb-4 border-t"
          style={{
            background: 'rgba(22, 24, 27, 0.98)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderColor: 'var(--hub-stroke)',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={!gameType || !courseId || isSubmitting}
            className={cn(
              "w-full h-[52px] rounded-2xl text-[15px] font-semibold transition-all duration-150",
              "border backdrop-blur-sm",
              !gameType || !courseId || isSubmitting
                ? "bg-white/[0.04] border-white/[0.08] text-white/40 cursor-not-allowed opacity-55"
                : "bg-white/[0.12] border-white/20 text-white shadow-lg hover:bg-white/[0.16] active:scale-[0.97]"
            )}
            style={{ 
              userSelect: 'none', 
              WebkitTapHighlightColor: 'transparent', 
              WebkitTouchCallout: 'none', 
              WebkitUserSelect: 'none',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {isSubmitting ? 'Creating…' : 'Create Game'}
          </button>
        </div>
      </div>
    </div>
  );
}
