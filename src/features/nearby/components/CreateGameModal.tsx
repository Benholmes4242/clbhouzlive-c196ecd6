import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Calendar, Users, Tag, MessageSquare } from 'lucide-react';
import { GameBeacon } from '../hooks/useGameBeacon';
import { useCourseSearch, GolfCourse } from '../hooks/useCourseSearch';
import { Button } from '@/components/ui/button';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBeacon: (input: {
    course_id?: string;
    course_name?: string;
    start_time: string;
    slots_total: number;
    tagged_user_ids?: string[];
    note?: string;
  }) => Promise<void>;
  onCancelBeacon: (beaconId: string) => Promise<void>;
  myBeacon: GameBeacon | null;
  prefilledClub?: { id: string; name: string };
}

export function CreateGameModal({
  isOpen,
  onClose,
  onCreateBeacon,
  onCancelBeacon,
  myBeacon,
  prefilledClub,
}: CreateGameModalProps) {
  const [courseId, setCourseId] = useState<string>(prefilledClub?.id || '');
  const [courseName, setCourseName] = useState<string>(prefilledClub?.name || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [availableSlots, setAvailableSlots] = useState<1 | 2 | 3>(3);
  const [taggedPlayers, setTaggedPlayers] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { courses, isLoading } = useCourseSearch(searchTerm);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate current players (host + tagged)
  const currentPlayers = 1 + taggedPlayers.length;
  
  // Calculate max selectable slots (can't exceed 4 total)
  const maxSelectableSlots = 4 - currentPlayers;
  
  // Game size label
  const gameSizeLabels = ['One-ball', 'Two-ball', 'Three-ball', 'Four-ball'];
  const gameSizeLabel = currentPlayers <= 4 ? `${gameSizeLabels[currentPlayers - 1]} game` : '';

  // Auto-adjust available slots when tagged players change
  useEffect(() => {
    if (availableSlots > maxSelectableSlots) {
      setAvailableSlots(maxSelectableSlots as 1 | 2 | 3);
    }
  }, [maxSelectableSlots, availableSlots]);

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

  const handleCourseSelect = (course: GolfCourse) => {
    setCourseId(course.id);
    setCourseName(course.name);
    setSearchTerm(''); // Clear search buffer
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If user types, treat as new search - clear selection
    const value = e.target.value;
    setSearchTerm(value);
    if (value !== courseName) {
      setCourseId('');
      setCourseName('');
    }
    if (!showDropdown) setShowDropdown(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!courseId) {
      alert('Please pick a club from the list.');
      return;
    }

    const start = new Date(startTime);
    if (start <= new Date()) {
      alert('Start time must be in the future.');
      return;
    }

    const slotsTotal = currentPlayers + availableSlots;
    if (slotsTotal > 4) {
      alert('Maximum 4 players total.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateBeacon({
        course_id: courseId,
        course_name: courseName,
        start_time: start.toISOString(),
        slots_total: slotsTotal,
        tagged_user_ids: taggedPlayers,
        note: note.trim() || undefined,
      });
      onClose();
      // Reset form
      setCourseId('');
      setCourseName('');
      setSearchTerm('');
      setStartTime(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        return now.toISOString().slice(0, 16);
      });
      setAvailableSlots(3);
      setTaggedPlayers([]);
      setNote('');
    } finally {
      setIsSubmitting(false);
    }
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

  const isValid = courseId && startTime && (currentPlayers + availableSlots <= 4);

  return (
    <div 
      className="fixed inset-0 flex items-end sm:items-center sm:justify-center animate-fade-in"
      style={{ 
        zIndex: 10000,
        backgroundColor: 'rgba(0,0,0,0)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        overscrollBehavior: 'none',
        touchAction: 'none',
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        style={{ 
          height: 'calc(100vh - env(safe-area-inset-top))',
          maxHeight: '100vh',
          touchAction: 'auto',
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
          <div className="grid grid-cols-3 items-center mb-3" style={{ userSelect: 'none' }}>
            <div />
            <div className="text-center">
              <h2 className="text-white text-[17px] font-semibold">
                {myBeacon ? 'Your Game' : 'Create a Game'}
              </h2>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white/90 transition-colors active:scale-95 w-11 h-11 flex items-center justify-center -mr-2"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
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
              {/* Golf course */}
              <div className="space-y-3 relative">
                <label className="block text-sm font-medium text-white/90">
                  <MapPin className="w-4 h-4 inline mr-2 text-white/60" />
                  Golf course
                </label>
                
                {courseName && !showDropdown ? (
                  // Selected state
                  <div className="w-full py-3 px-4 bg-neutral-800/50 rounded-xl flex items-center justify-between border border-neutral-700/50">
                    <span className="text-sm text-white">{courseName}</span>
                    <button
                      onClick={() => {
                        setCourseId('');
                        setCourseName('');
                        setSearchTerm('');
                        setShowDropdown(true);
                        setTimeout(() => inputRef.current?.focus(), 100);
                      }}
                      className="text-xs text-white/60 hover:text-white px-2"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  // Search state
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search club name..."
                      value={searchTerm}
                      onChange={handleInputChange}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full py-3 px-4 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                    
                    {showDropdown && searchTerm.length >= 2 && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowDropdown(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto backdrop-blur-xl">
                          {isLoading ? (
                            <div className="px-4 py-3 text-sm text-white/50">
                              Searching...
                            </div>
                          ) : courses.length > 0 ? (
                            courses.map((course) => (
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
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-white/50">
                              No clubs found
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {courseName && (
                  <p className="text-xs text-white/50">Selected: {courseName}</p>
                )}
              </div>

              {/* Start time */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/90">
                  <Calendar className="w-4 h-4 inline mr-2 text-white/60" />
                  Start time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full py-3 px-4 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              {/* Tag Players */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-white/60">
                    <Tag className="w-4 h-4 inline mr-2" />
                    Tag Players
                  </label>
                  {gameSizeLabel && (
                    <span className="text-xs text-white/50">{gameSizeLabel}</span>
                  )}
                </div>
                <div className="py-3 px-4 bg-neutral-800/30 rounded-xl border border-neutral-700/50 text-sm text-white/50">
                  {taggedPlayers.length === 0 ? 'No players tagged yet' : `${taggedPlayers.length} player(s) tagged`}
                </div>
                <p className="text-xs text-white/50">
                  Tagging coming soon - reserve seats for specific players
                </p>
              </div>

              {/* Available slots */}
              {maxSelectableSlots > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-white/90">
                    <Users className="w-4 h-4 inline mr-2 text-white/60" />
                    Available slots
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAvailableSlots(n as 1 | 2 | 3)}
                        disabled={n > maxSelectableSlots}
                        className={`py-3 px-4 rounded-xl font-medium transition-all backdrop-blur ${
                          availableSlots === n
                            ? 'bg-white/20 text-white border border-white/28 shadow-[0_20px_48px_rgba(0,0,0,0.9),_0_0_30px_rgba(255,255,255,0.18)_inset]'
                            : n > maxSelectableSlots
                            ? 'bg-white/5 text-white/30 border border-white/8 opacity-50 cursor-not-allowed'
                            : 'bg-white/5 text-white/70 border border-white/12 hover:bg-white/10'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-center text-white/50">
                    {availableSlots === 1 ? '1 slot available' : `${availableSlots} slots available`}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/60">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Notes (optional)
                </label>
                <textarea
                  placeholder="Add details about the game..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                  rows={2}
                  className="w-full py-3 px-4 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                />
                <p className="text-xs text-white/50 text-right">
                  {note.length}/200
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 active:bg-white/30 text-white rounded-xl font-medium backdrop-blur border border-white/28 shadow-[0_20px_48px_rgba(0,0,0,0.9),_0_0_30px_rgba(255,255,255,0.18)_inset] active:shadow-[0_24px_54px_rgba(0,0,0,0.9),_0_0_40px_rgba(255,255,255,0.28)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Game'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
