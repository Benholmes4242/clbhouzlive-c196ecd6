import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, MapPin } from 'lucide-react';
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

interface CreateGameFormProps {
  prefilledClub?: { id: string; name: string };
  onSubmit: (input: {
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
}

interface ValidationErrors {
  slotsTotal?: string;
  startTime?: string;
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

export function CreateGameForm({ prefilledClub, onSubmit }: CreateGameFormProps) {
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
  
  const [courseQuery, setCourseQuery] = useState('');
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const { courses, isLoading: isSearchingCourses } = useCourseSearch(courseQuery);

  const currentPlayers = 1 + selectedUsers.length;
  const maxAvailableSlots = 4 - currentPlayers;

  useEffect(() => {
    if (prefilledClub) {
      setCourseId(prefilledClub.id);
      setCourseName(prefilledClub.name);
      setSelectedClub({ id: prefilledClub.id, name: prefilledClub.name });
    }
  }, [prefilledClub]);

  useEffect(() => {
    if (availableSlots > maxAvailableSlots) {
      setAvailableSlots(Math.max(1, maxAvailableSlots));
    }
  }, [currentPlayers, maxAvailableSlots, availableSlots]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    const now = new Date();

    if (timing === 'choose' && customDateTime) {
      if (customDateTime < now) {
        errors.startTime = 'Start time cannot be in the past';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      haptic('heavy');
      return;
    }

    setIsSubmitting(true);

    try {
      let startTime = new Date();
      if (timing === '30') {
        startTime = new Date(Date.now() + 30 * 60 * 1000);
      } else if (timing === '60') {
        startTime = new Date(Date.now() + 60 * 60 * 1000);
      } else if (timing === 'choose' && customDateTime) {
        startTime = customDateTime;
      }

      const totalSlots = currentPlayers + availableSlots;
      
      const taggedUserIds = selectedUsers
        .filter(u => u.id)
        .map(u => u.id);
      
      const guestParticipants = selectedUsers
        .filter(u => u.guest_name)
        .map(u => ({ guest_name: u.guest_name }));

      await onSubmit({
        game_type: gameType,
        course_name: courseName || undefined,
        course_id: courseId || undefined,
        note: note.trim() || undefined,
        visibility,
        start_time: startTime.toISOString(),
        players_needed: availableSlots,
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

  const getTaggedPlayersSummary = () => {
    if (selectedUsers.length === 0) return null;
    if (selectedUsers.length === 1) return selectedUsers[0].username || selectedUsers[0].guest_name;
    if (selectedUsers.length === 2) {
      return `${selectedUsers[0].username || selectedUsers[0].guest_name}, ${selectedUsers[1].username || selectedUsers[1].guest_name}`;
    }
    return `${selectedUsers[0].username || selectedUsers[0].guest_name}, ${selectedUsers[1].username || selectedUsers[1].guest_name} +${selectedUsers.length - 2} more`;
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto" data-scroll-container>
      <div className="px-4 pt-6 space-y-5" style={{ paddingBottom: '120px' }}>
        {/* Game Type */}
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

        {/* Golf Course */}
        <div className="space-y-2">
          <label className="sectionLabel">Select a golf club</label>
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
                  onClick={() => {
                    setSelectedClub(null);
                    setCourseId('');
                    setCourseName('');
                    setCourseError('');
                  }}
                >
                  ✕
                </TapButton>
              </div>
            </div>
          ) : (
            <>
              <div className="clubSearchBar" onClick={() => setIsCourseDropdownOpen(true)}>
                <Search className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                <input
                  type="text"
                  placeholder="Search golf club..."
                  value={courseQuery}
                  onChange={(e) => {
                    setCourseQuery(e.target.value);
                    setIsCourseDropdownOpen(true);
                  }}
                  onFocus={() => setIsCourseDropdownOpen(true)}
                  className="clubSearchInput"
                  data-keyboard-aware
                />
              </div>

              {isCourseDropdownOpen && courseQuery && (
                <div className="clubSearchResults">
                  {isSearchingCourses ? (
                    <div className="noResults">Searching...</div>
                  ) : courses.length > 0 ? (
                    courses.map((club) => (
                      <button
                        key={club.id}
                        type="button"
                        onClick={() => {
                          setSelectedClub({ id: club.id, name: club.name });
                          setCourseId(club.id);
                          setCourseName(club.name);
                          setCourseQuery('');
                          setIsCourseDropdownOpen(false);
                          setCourseError('');
                          haptic('light');
                        }}
                        className="clubResultRow"
                      >
                        <MapPin className="w-[18px] h-[18px]" style={{ color: 'white' }} />
                        <div className="clubResultInfo">
                          <div className="clubResultName">{club.name}</div>
                          {club.region && <div className="clubResultLocation">{club.region}</div>}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="noResults">No clubs found</div>
                  )}
                </div>
              )}
            </>
          )}
          {courseError && (
            <div className="errorMsg">
              <AlertCircle className="w-4 h-4" />
              <span>{courseError}</span>
            </div>
          )}
        </div>

        {/* Tag Players */}
        <div className="space-y-2">
          <label className="sectionLabel">Tag players (optional)</label>
          <UserSearchTypeahead
            selectedUsers={selectedUsers}
            onUserAdd={(user) => setSelectedUsers([...selectedUsers, user])}
            onUserRemove={(userId) => setSelectedUsers(selectedUsers.filter(u => u.id !== userId && u.guest_name !== userId))}
            maxUsers={3}
          />
        </div>

        {/* When */}
        <div className="space-y-2">
          <label className="sectionLabel">When</label>
          <div className="grid grid-cols-2 gap-2">
            {TIMING_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleTimingChange(option.value)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                  "border backdrop-blur-sm",
                  "active:scale-[0.97]",
                  timing === option.value
                    ? "bg-transparent border-white/30 text-white"
                    : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]"
                )}
                style={{ letterSpacing: '0.2px' }}
              >
                {option.value === 'choose' && customDateTime ? getTimingDisplay() : option.label}
              </button>
            ))}
          </div>
          {validationErrors.startTime && (
            <div className="errorMsg">
              <AlertCircle className="w-4 h-4" />
              <span>{validationErrors.startTime}</span>
            </div>
          )}
        </div>

        {/* Available Slots */}
        <div className="space-y-2">
          <label className="sectionLabel">Players needed</label>
          <div className="flex gap-2">
            {[1, 2, 3].filter(n => n <= maxAvailableSlots).map((slots) => (
              <button
                key={slots}
                type="button"
                onClick={() => {
                  setAvailableSlots(slots);
                  haptic('light');
                }}
                disabled={slots > maxAvailableSlots}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                  "border backdrop-blur-sm",
                  "active:scale-[0.97]",
                  availableSlots === slots
                    ? "bg-transparent border-white/30 text-white"
                    : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]",
                  slots > maxAvailableSlots && "opacity-40 cursor-not-allowed"
                )}
                style={{ letterSpacing: '0.2px' }}
              >
                {slots}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <label className="sectionLabel">Who can see this game</label>
          <GameVisibilitySelector
            value={visibility}
            onChange={(val) => {
              setVisibility(val);
              haptic('light');
            }}
          />
        </div>

        {/* Note */}
        <div className="space-y-2">
          <label className="sectionLabel">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="We are looking for a fourth player, casual round, money match - who's in?"
            className="w-full px-4 py-3 rounded-xl text-sm resize-none"
            style={{
              minHeight: '100px',
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--hub-text)',
              letterSpacing: '0.2px',
            }}
            data-keyboard-aware
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl text-base font-semibold transition-all duration-150 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(to bottom right, #6E9277, #89A78C)',
            color: 'white',
            letterSpacing: '0.3px',
          }}
        >
          {isSubmitting ? 'Creating...' : 'Create game'}
        </button>
      </div>
    </form>
  );
}
