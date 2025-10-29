import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { GameBeacon } from '../hooks/useGameBeacon';
import { useCourseSearch } from '../hooks/useCourseSearch';
import { DateTimePicker } from './DateTimePicker';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

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
    note?: string;
    start_time?: string;
    players_needed?: number;
    host_handicap?: number;
    other_player_handicaps?: number[];
    tee_time?: string;
  }) => Promise<void>;
  onCancelBeacon: (beaconId: string) => Promise<void>;
  myBeacon: GameBeacon | null;
  prefilledClub?: { id: string; name: string };
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

export function CreateGameModal({
  isOpen,
  onClose,
  onCreateBeacon,
  onCancelBeacon,
  myBeacon,
  prefilledClub,
}: CreateGameModalProps) {
  const [gameType, setGameType] = useState<string>('9_holes');
  const [courseName, setCourseName] = useState('');
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [note, setNote] = useState('');
  const [timing, setTiming] = useState<string>('now');
  const [customDateTime, setCustomDateTime] = useState<Date | null>(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [playersNeeded, setPlayersNeeded] = useState<number | null>(null);
  const [hostHandicap, setHostHandicap] = useState<string>('');
  const [otherHandicaps, setOtherHandicaps] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const courseInputRef = useRef<HTMLInputElement>(null);
  
  const { courses } = useCourseSearch(courseSearchTerm);

  // Pre-fill host handicap from user profile
  useEffect(() => {
    const fetchUserHandicap = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('eg_handicap_index')
        .eq('id', user.id)
        .single();

      if (profile?.eg_handicap_index !== null) {
        setHostHandicap(profile.eg_handicap_index.toString());
      }
    };

    if (isOpen) {
      fetchUserHandicap();
    }
  }, [isOpen]);

  // Pre-fill club if provided
  useEffect(() => {
    if (prefilledClub && !courseName) {
      setCourseName(prefilledClub.name);
      setCourseSearchTerm(prefilledClub.name);
    }
  }, [prefilledClub, courseName]);

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

  const handleSubmit = async () => {
    if (!gameType) return;

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

    // Parse other handicaps if provided
    const otherHandicapsArray = otherHandicaps
      .split(',')
      .map(h => parseFloat(h.trim()))
      .filter(h => !isNaN(h));

    setIsSubmitting(true);
    try {
      await onCreateBeacon({
        game_type: gameType,
        course_name: courseName || undefined,
        note: note || undefined,
        start_time: startTime.toISOString(),
        tee_time: startTime.toISOString(), // Use same time as start_time
        players_needed: playersNeeded || undefined,
        host_handicap: hostHandicap ? parseFloat(hostHandicap) : undefined,
        other_player_handicaps: otherHandicapsArray.length > 0 ? otherHandicapsArray : undefined,
      });
      onClose();
      // Reset form
      setGameType('9_holes');
      setCourseName('');
      setCourseSearchTerm('');
      setNote('');
      setTiming('now');
      setCustomDateTime(null);
      setPlayersNeeded(null);
      setHostHandicap('');
      setOtherHandicaps('');
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

  const handleCourseSelect = (course: { name: string }) => {
    setCourseName(course.name);
    setCourseSearchTerm(course.name);
    setShowCourseDropdown(false);
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
      className="fixed inset-0 flex items-end sm:items-center sm:justify-center"
      style={{ 
        zIndex: 10000, // Above NearbyOverlay's z-9999
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ 
          maxHeight: '80vh', // Match NearbyOverlay
          touchAction: 'auto',
          overscrollBehavior: 'contain',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-neutral-800 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-4 p-2 rounded-full hover:bg-neutral-800 transition-colors opacity-80"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {myBeacon ? 'Your Game' : 'Create a Game'}
          </h2>
          <p className="text-[15px] text-white/70 mt-1">
            {myBeacon ? 'Currently hosting' : 'Let nearby golfers know you\'re looking to play'}
          </p>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto p-6"
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Game type</span>
                  <span className="text-sm font-medium text-neutral-200">{formatGameTypeDisplay(myBeacon.game_type)}</span>
                </div>
                {myBeacon.course_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Location</span>
                    <span className="text-sm font-medium text-neutral-200">{myBeacon.course_name}</span>
                  </div>
                )}
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
              
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Cancelling...' : 'Cancel Game'}
              </button>
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
                    <button
                      key={type.value}
                      onClick={() => setGameType(type.value)}
                      className={`py-3 px-4 rounded-xl font-medium transition-all backdrop-blur ${
                        gameType === type.value
                          ? 'bg-white/11 text-white border border-white/22 shadow-[0_20px_40px_rgba(0,0,0,0.9),_0_0_24px_rgba(255,255,255,0.22)_inset] active:bg-white/16 active:shadow-[0_24px_48px_rgba(0,0,0,0.9),_0_0_32px_rgba(255,255,255,0.28)_inset]'
                          : 'bg-white/5 text-white/70 border border-white/12 shadow-[0_8px_24px_rgba(0,0,0,0.8)] hover:bg-white/10'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3 relative">
                <label className="block text-sm font-medium text-white/60">
                  Where
                </label>
                <input
                  ref={courseInputRef}
                  type="text"
                  placeholder="Golf course …"
                  value={courseSearchTerm}
                  onChange={(e) => {
                    setCourseSearchTerm(e.target.value);
                    setShowCourseDropdown(true);
                  }}
                  onFocus={() => setShowCourseDropdown(true)}
                  className="w-full py-3 px-4 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                {showCourseDropdown && courses.length > 0 && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowCourseDropdown(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto backdrop-blur-xl">
                      {courses.map((course) => (
                        <button
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
                        </button>
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

              {/* Timing */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/60">
                  When
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TIMING_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleTimingChange(option.value)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all backdrop-blur ${
                        timing === option.value
                          ? 'bg-white/11 text-white border border-white/22 shadow-[0_20px_40px_rgba(0,0,0,0.9),_0_0_24px_rgba(255,255,255,0.22)_inset] active:bg-white/16 active:shadow-[0_24px_48px_rgba(0,0,0,0.9),_0_0_32px_rgba(255,255,255,0.28)_inset]'
                          : 'bg-white/5 text-white/70 border border-white/12 shadow-[0_8px_24px_rgba(0,0,0,0.8)] hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {timing === 'choose' && customDateTime && (
                  <div className="text-sm text-white/80 text-center mt-2">
                    {getTimingDisplay()}
                  </div>
                )}
              </div>

              {/* Players Needed */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/60">
                  Players Needed
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLAYERS_OPTIONS.map(num => (
                    <button
                      key={num}
                      onClick={() => setPlayersNeeded(playersNeeded === num ? null : num)}
                      className={`py-3 px-4 rounded-xl font-medium transition-all backdrop-blur ${
                        playersNeeded === num
                          ? 'bg-white/11 text-white border border-white/22 shadow-[0_20px_40px_rgba(0,0,0,0.9),_0_0_24px_rgba(255,255,255,0.22)_inset] active:bg-white/16 active:shadow-[0_24px_48px_rgba(0,0,0,0.9),_0_0_32px_rgba(255,255,255,0.28)_inset]'
                          : 'bg-white/5 text-white/70 border border-white/12 shadow-[0_8px_24px_rgba(0,0,0,0.8)] hover:bg-white/10'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Your Handicap */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/60">
                  Your Handicap
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5.2"
                  value={hostHandicap}
                  onChange={(e) => setHostHandicap(e.target.value)}
                  className="w-full py-3 px-4 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              {/* Other Players' Handicaps */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/60">
                  Other Players' Handicaps (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3, 4.5, 6"
                  value={otherHandicaps}
                  onChange={(e) => setOtherHandicaps(e.target.value)}
                  className="w-full py-3 px-4 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                <p className="text-xs text-neutral-500">
                  Comma-separated handicaps of players already in your group
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!gameType || isSubmitting}
                className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 active:bg-white/30 text-white rounded-xl font-medium backdrop-blur border border-white/28 shadow-[0_20px_48px_rgba(0,0,0,0.9),_0_0_30px_rgba(255,255,255,0.18)_inset] active:shadow-[0_24px_54px_rgba(0,0,0,0.9),_0_0_40px_rgba(255,255,255,0.28)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Start Game'}
              </button>
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

