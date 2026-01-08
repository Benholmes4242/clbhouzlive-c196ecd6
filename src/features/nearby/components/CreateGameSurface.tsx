/**
 * CreateGameSurface - Reusable Create Game form body
 * Contains all state, hooks, and UI for creating a game
 * Can be rendered in a sheet or standalone page
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { AlertCircle, Search, MapPin, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useCourseSearch } from '../hooks/useCourseSearch';
import { UserSearchTypeahead } from './UserSearchTypeahead';
import { VisibilityPillSelector } from './VisibilityPillSelector';
import type { GameVisibility } from '../types';
import { format } from 'date-fns';
import { TapButton } from '@/components/ui/TapButton';
import { openCalendarPicker } from './CalendarPicker';
import { openTimePicker } from './TimePicker';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import './CreateGame.css';
import '../GamesTab.css';

export interface CreateGameSurfaceRef {
  submit: () => void;
  isValid: () => boolean;
  isSubmitting: boolean;
  scrollToFirstError: () => void;
}

interface CreateGameSurfaceProps {
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
  /** Extra padding at bottom for sticky footer */
  bottomPadding?: number;
  /** Hide the submit button (for external sticky footer) */
  hideSubmitButton?: boolean;
  /** Callback when submitting state changes */
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

interface ValidationErrors {
  slotsTotal?: string;
  startTime?: string;
  course?: string;
}

// Separated: Holes options
const HOLES_OPTIONS = [
  { value: '9', label: '9 holes' },
  { value: '18', label: '18 holes' },
];

// Separated: Format options  
const FORMAT_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'practice', label: 'Practice' },
];

const TIMING_OPTIONS = [
  { value: 'now', label: 'Now' },
  { value: '30', label: 'In 30 mins' },
  { value: '60', label: 'In 1 hour' },
  { value: 'choose', label: 'Choose' },
];

export const CreateGameSurface = forwardRef<CreateGameSurfaceRef, CreateGameSurfaceProps>(
  ({ prefilledClub, onSubmit, bottomPadding = 120, hideSubmitButton = false, onSubmittingChange }, ref) => {
    // Split game type into holes + format
    const [holes, setHoles] = useState<string>('18');
    const [gameFormat, setGameFormat] = useState<string>('casual');
    
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
    
    // Collapsible tag players section
    const [isTagPlayersExpanded, setIsTagPlayersExpanded] = useState(false);
    
    const [courseQuery, setCourseQuery] = useState('');
    const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
    const { courses, isLoading: isSearchingCourses } = useCourseSearch(courseQuery);

    // Refs for scrolling to errors
    const courseRef = useRef<HTMLDivElement>(null);
    const timingRef = useRef<HTMLDivElement>(null);

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
        setAvailableSlots(Math.max(0, maxAvailableSlots));
      }
    }, [currentPlayers, maxAvailableSlots, availableSlots]);

    useEffect(() => {
      onSubmittingChange?.(isSubmitting);
    }, [isSubmitting, onSubmittingChange]);

    const validateForm = (): boolean => {
      const errors: ValidationErrors = {};
      const now = new Date();

      // Course is required
      if (!courseId && !courseName) {
        errors.course = 'Please select a golf club';
      }

      if (timing === 'choose' && customDateTime) {
        if (customDateTime < now) {
          errors.startTime = 'Start time cannot be in the past';
        }
      }

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const scrollToFirstError = () => {
      if (validationErrors.course && courseRef.current) {
        courseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (validationErrors.startTime && timingRef.current) {
        timingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
      e?.preventDefault();
      
      if (!validateForm()) {
        haptic('heavy');
        setTimeout(scrollToFirstError, 100);
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

        // Combine holes + format into game_type
        const gameType = `${holes}_holes_${gameFormat}`;

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
        setHoles('18');
        setGameFormat('casual');
        setCourseId('');
        setCourseName('');
        setSelectedClub(null);
        setNote('');
        setVisibility('public');
        setTiming('now');
        setCustomDateTime(null);
        setAvailableSlots(3);
        setSelectedUsers([]);
        setIsTagPlayersExpanded(false);
      } catch (error) {
        console.error('Error creating beacon:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    // Expose submit method via ref
    useImperativeHandle(ref, () => ({
      submit: () => handleSubmit(),
      isValid: () => validateForm(),
      isSubmitting,
      scrollToFirstError,
    }));

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


    return (
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto" data-scroll-container>
        <div className="px-4 pt-3 space-y-5" style={{ paddingBottom: `${bottomPadding}px` }}>
          
          {/* Golf Course - HERO SECTION */}
          <div className="space-y-2" ref={courseRef}>
            <label className="sectionLabel">Golf club</label>
            {selectedClub ? (
              <div className="selectedClubRow">
                <MapPin className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                <span className="flex-1 font-medium text-sm" style={{ color: 'var(--hub-text)' }}>
                  {selectedClub.name}
                </span>
                <TapButton 
                  className="changeBtn" 
                  onClick={() => {
                    setSelectedClub(null);
                    setCourseId('');
                    setCourseName('');
                    setValidationErrors(prev => ({ ...prev, course: undefined }));
                    haptic('light');
                  }}
                >
                  Change
                </TapButton>
              </div>
            ) : (
              <>
                <div 
                  className={cn(
                    "clubSearchBar clubSearchBarHero",
                    validationErrors.course && "clubSearchBarError"
                  )} 
                  onClick={() => setIsCourseDropdownOpen(true)}
                >
                  <Search className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                  <input
                    type="text"
                    placeholder="Search golf club..."
                    value={courseQuery}
                    onChange={(e) => {
                      setCourseQuery(e.target.value);
                      setIsCourseDropdownOpen(true);
                      setValidationErrors(prev => ({ ...prev, course: undefined }));
                    }}
                    onFocus={() => setIsCourseDropdownOpen(true)}
                    className="clubSearchInput"
                    data-keyboard-aware
                  />
                </div>

                {isCourseDropdownOpen && courseQuery && (
                  <div className="resultsSheet">
                    {isSearchingCourses ? (
                      <div className="hint">Searching...</div>
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
                            setValidationErrors(prev => ({ ...prev, course: undefined }));
                            haptic('light');
                          }}
                          className="resultRow"
                        >
                          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--hub-text-dim)' }} />
                          <div className="rMid">
                            <div className="rTitle">{club.name}</div>
                            {club.region && <div className="rSub">{club.region}</div>}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="hint">No clubs found</div>
                    )}
                  </div>
                )}
              </>
            )}
            {validationErrors.course && (
              <div className="errorMsg">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{validationErrors.course}</span>
              </div>
            )}
          </div>

          {/* Game Type - Split into Holes + Format */}
          <div className="space-y-3">
            {/* Holes Selection */}
            <div className="space-y-2">
              <label className="sectionLabel">Holes</label>
              <div className="flex gap-2">
                {HOLES_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setHoles(option.value);
                      haptic('light');
                    }}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                      "border active:scale-[0.97]",
                      holes === option.value
                        ? "bg-[var(--hub-glass-bg)] border-[var(--hub-stroke-strong)] text-[var(--hub-text)]"
                        : "bg-[var(--hub-glass-bg-subtle)] border-[var(--hub-stroke-subtle)] text-[var(--hub-text-sub)] hover:bg-[var(--hub-glass-bg-hover)]"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="sectionLabel">Format</label>
              <div className="flex gap-2">
                {FORMAT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setGameFormat(option.value);
                      haptic('light');
                    }}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                      "border active:scale-[0.97]",
                      gameFormat === option.value
                        ? "bg-[var(--hub-glass-bg)] border-[var(--hub-stroke-strong)] text-[var(--hub-text)]"
                        : "bg-[var(--hub-glass-bg-subtle)] border-[var(--hub-stroke-subtle)] text-[var(--hub-text-sub)] hover:bg-[var(--hub-glass-bg-hover)]"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* When */}
          <div className="space-y-2" ref={timingRef}>
            <label className="sectionLabel">When</label>
            <div className="grid grid-cols-2 gap-2">
              {TIMING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTimingChange(option.value)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    "border active:scale-[0.97]",
                    timing === option.value
                      ? "bg-[var(--hub-glass-bg)] border-[var(--hub-stroke-strong)] text-[var(--hub-text)]"
                      : "bg-[var(--hub-glass-bg-subtle)] border-[var(--hub-stroke-subtle)] text-[var(--hub-text-sub)] hover:bg-[var(--hub-glass-bg-hover)]"
                  )}
                >
                  {option.value === 'choose' && customDateTime ? getTimingDisplay() : option.label}
                </button>
              ))}
            </div>
            {validationErrors.startTime && (
              <div className="errorMsg">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{validationErrors.startTime}</span>
              </div>
            )}
          </div>

          {/* Players Needed */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label className="sectionLabel" style={{ margin: 0 }}>Players needed</label>
              <span className="helper">How many more?</span>
            </div>
            {maxAvailableSlots <= 0 ? (
              <div 
                className="px-4 py-3 rounded-xl text-sm font-medium text-center"
                style={{ 
                  background: 'var(--hub-glass-bg-subtle)',
                  border: '1px solid var(--hub-stroke-subtle)',
                  color: 'var(--hub-text-sub)',
                }}
              >
                Full party
              </div>
            ) : (
              <div className="flex gap-2">
                {[1, 2, 3].filter(n => n <= maxAvailableSlots).map((slots) => (
                  <button
                    key={slots}
                    type="button"
                    onClick={() => {
                      setAvailableSlots(slots);
                      haptic('light');
                    }}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                      "border active:scale-[0.97]",
                      availableSlots === slots
                        ? "bg-[var(--hub-glass-bg)] border-[var(--hub-stroke-strong)] text-[var(--hub-text)]"
                        : "bg-[var(--hub-glass-bg-subtle)] border-[var(--hub-stroke-subtle)] text-[var(--hub-text-sub)] hover:bg-[var(--hub-glass-bg-hover)]"
                    )}
                  >
                    {slots}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tag Players - Collapsible */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsTagPlayersExpanded(!isTagPlayersExpanded);
                haptic('light');
              }}
              className="collapsibleHeader"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--hub-text)' }}>
                  Invite players
                </span>
                {selectedUsers.length > 0 && (
                  <span className="tagCount">{selectedUsers.length}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--hub-text-dim)' }}>Optional</span>
                {isTagPlayersExpanded ? (
                  <ChevronUp className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                )}
              </div>
            </button>
            
            {isTagPlayersExpanded && (
              <div className="pt-2">
                <UserSearchTypeahead
                  selectedUsers={selectedUsers}
                  onUserAdd={(user) => setSelectedUsers([...selectedUsers, user])}
                  onUserRemove={(userId) => setSelectedUsers(selectedUsers.filter(u => u.id !== userId && u.guest_name !== userId))}
                  maxUsers={3}
                />
              </div>
            )}
          </div>

          {/* Visibility - Pill Selector */}
          <div className="space-y-2">
            <label className="sectionLabel">Visibility</label>
            <VisibilityPillSelector
              value={visibility}
              onChange={(val) => {
                setVisibility(val);
                haptic('light');
              }}
            />
          </div>

          {/* Note - Compact */}
          <div className="space-y-2">
            <label className="sectionLabel">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a message for players…"
              className="noteTextarea"
              data-keyboard-aware
            />
          </div>

          {/* Submit Button - Only show if not hidden */}
          {!hideSubmitButton && (
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
          )}
        </div>
      </form>
    );
  }
);

CreateGameSurface.displayName = 'CreateGameSurface';
