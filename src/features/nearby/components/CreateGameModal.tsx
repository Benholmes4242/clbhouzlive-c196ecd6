import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { GameBeacon } from '../hooks/useGameBeacon';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBeacon: (input: {
    game_type: string;
    course_name?: string;
    note?: string;
    durationMinutes?: number;
  }) => Promise<void>;
  onCancelBeacon: (beaconId: string) => Promise<void>;
  myBeacon: GameBeacon | null;
}

const GAME_TYPES = [
  { value: '9 holes', label: '9 holes' },
  { value: '18 holes', label: '18 holes' },
  { value: 'Range', label: 'Range' },
  { value: 'Practice', label: 'Practice' },
];

const DURATION_OPTIONS = [
  { value: 30, label: '30 mins' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
];

export function CreateGameModal({
  isOpen,
  onClose,
  onCreateBeacon,
  onCancelBeacon,
  myBeacon,
}: CreateGameModalProps) {
  const [gameType, setGameType] = useState<string>('9 holes');
  const [courseName, setCourseName] = useState('');
  const [note, setNote] = useState('');
  const [duration, setDuration] = useState(120);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    try {
      await onCreateBeacon({
        game_type: gameType,
        course_name: courseName || undefined,
        note: note || undefined,
        durationMinutes: duration,
      });
      onClose();
      // Reset form
      setGameType('9 holes');
      setCourseName('');
      setNote('');
      setDuration(120);
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-xl font-semibold text-neutral-100">
              {myBeacon ? 'Your Game' : 'Create a Game'}
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              {myBeacon ? 'Currently hosting' : 'Let nearby golfers know you\'re looking to play'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {myBeacon ? (
            // Show existing beacon
            <div className="space-y-4">
              <div className="bg-neutral-800/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Game type</span>
                  <span className="text-sm font-medium text-neutral-200">{myBeacon.game_type}</span>
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
                          ? 'bg-white/15 text-white border border-white/22 shadow-[0_12px_32px_rgba(0,0,0,0.8),_0_0_16px_rgba(255,255,255,0.45),_0_0_40px_rgba(255,255,255,0.25)] active:bg-white/20'
                          : 'bg-white/5 text-white/70 border border-white/12 shadow-[0_8px_24px_rgba(0,0,0,0.8)] hover:bg-white/10'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/60">
                  Where
                </label>
                <input
                  type="text"
                  placeholder="Course / club / bay"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full py-3 px-4 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
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

              {/* Duration */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/60">
                  How long are you available?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATION_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setDuration(option.value)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all backdrop-blur ${
                        duration === option.value
                          ? 'bg-white/15 text-white border border-white/22 shadow-[0_12px_32px_rgba(0,0,0,0.8),_0_0_16px_rgba(255,255,255,0.45),_0_0_40px_rgba(255,255,255,0.25)] active:bg-white/20'
                          : 'bg-white/5 text-white/70 border border-white/12 shadow-[0_8px_24px_rgba(0,0,0,0.8)] hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
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
    </div>
  );
}
