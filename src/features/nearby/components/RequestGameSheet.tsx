import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface RequestGameSheetProps {
  open: boolean;
  onClose: () => void;
  defaultAudience?: 'friends' | 'nearby' | 'all';
  defaultWhen?: 'now' | '30' | '60' | 'choose';
  defaultClubId?: string;
  onSubmit: (payload: RequestGamePayload) => Promise<void>;
}

export interface RequestGamePayload {
  start_at: string;
  end_at: string;
  club_id: string;
  club_name: string;
  players_needed: 1 | 2 | 3;
  format: '9_holes' | '18_holes' | 'range' | 'casual';
  notes?: string;
  audience: 'friends' | 'nearby' | 'all';
  push: boolean;
  source: 'nearby_modal' | 'open2play_button';
}

type WhenOption = 'now' | '30' | '60' | 'choose';
type FormatOption = '9_holes' | '18_holes' | 'range' | 'casual';

const whenOptions: { value: WhenOption; label: string }[] = [
  { value: 'now', label: 'Now' },
  { value: '30', label: 'In 30 min' },
  { value: '60', label: 'In 1 hour' },
  { value: 'choose', label: 'Choose…' },
];

const formatOptions: { value: FormatOption; label: string }[] = [
  { value: '9_holes', label: '9 holes' },
  { value: '18_holes', label: '18 holes' },
  { value: 'range', label: 'Range' },
  { value: 'casual', label: 'Casual' },
];

const audienceOptions: { value: 'friends' | 'nearby' | 'all'; label: string }[] = [
  { value: 'friends', label: 'Friends' },
  { value: 'nearby', label: 'Nearby' },
  { value: 'all', label: 'All' },
];

export function RequestGameSheet({
  open,
  onClose,
  defaultAudience = 'nearby',
  defaultWhen = 'now',
  defaultClubId,
  onSubmit,
}: RequestGameSheetProps) {
  const [when, setWhen] = useState<WhenOption>(defaultWhen);
  const [clubId, setClubId] = useState(defaultClubId || '');
  const [clubName, setClubName] = useState('');
  const [playersNeeded, setPlayersNeeded] = useState<1 | 2 | 3>(1);
  const [format, setFormat] = useState<FormatOption>('casual');
  const [notes, setNotes] = useState('');
  const [audience, setAudience] = useState<'friends' | 'nearby' | 'all'>(defaultAudience);
  const [push, setPush] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setWhen(defaultWhen);
      setClubId(defaultClubId || '');
      setClubName('');
      setPlayersNeeded(1);
      setFormat('casual');
      setNotes('');
      setAudience(defaultAudience);
      setPush(true);
      setIsSubmitting(false);
      setError(null);
    }
  }, [open, defaultWhen, defaultClubId, defaultAudience]);

  // Calculate start and end times
  const calculateTimes = () => {
    const now = new Date();
    let startAt: Date;

    switch (when) {
      case 'now':
        startAt = now;
        break;
      case '30':
        startAt = new Date(now.getTime() + 30 * 60000);
        break;
      case '60':
        startAt = new Date(now.getTime() + 60 * 60000);
        break;
      case 'choose':
        // TODO: Implement custom date/time picker
        startAt = now;
        break;
      default:
        startAt = now;
    }

    const endAt = new Date(startAt.getTime() + 90 * 60000); // 90 minutes default duration

    return {
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
    };
  };

  const isValid = clubId && clubName && playersNeeded && format && audience;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const times = calculateTimes();
      await onSubmit({
        ...times,
        club_id: clubId,
        club_name: clubName,
        players_needed: playersNeeded,
        format,
        notes: notes || undefined,
        audience,
        push,
        source: 'nearby_modal',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} zIndexBase={1500} ariaLabelledBy="request-game-title">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.12]" style={{ padding: '12px 20px' }}>
          <h2 id="request-game-title" className="text-[18px] font-semibold">Request a game</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '0 16px 12px' }}>
          {/* When */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-black/[0.56] dark:text-white/[0.64] mb-2.5">
              When
            </label>
            <div className="flex gap-2">
              {whenOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setWhen(option.value)}
                  aria-pressed={when === option.value}
                  className={cn(
                    'flex-1 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                    'border',
                    when === option.value
                      ? 'bg-[#E7EFEA] border-[#D2E1D7] text-[#0b0b0b] shadow-[0_0_0_3px_rgba(110,146,119,0.28)]'
                      : 'bg-[#F4F6F5] dark:bg-white/[0.06] border-transparent text-black/[0.72] dark:text-white/[0.88]'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Where */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-black/[0.56] dark:text-white/[0.64] mb-2.5">
              Where
            </label>
            <input
              type="text"
              placeholder="Select club…"
              value={clubName}
              onChange={(e) => {
                setClubName(e.target.value);
                // For now, use the name as ID (TODO: implement proper autocomplete)
                setClubId(e.target.value);
              }}
              className={cn(
                'w-full px-3.5 py-3 rounded-2xl text-sm',
                'bg-[#F4F6F5] dark:bg-white/[0.06]',
                'border border-black/[0.06] dark:border-white/[0.12]',
                'focus:outline-none focus:ring-2 focus:ring-[#6E9277]/30'
              )}
            />
          </div>

          {/* Players needed */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-black/[0.56] dark:text-white/[0.64] mb-2.5">
              Players needed
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setPlayersNeeded(n as 1 | 2 | 3)}
                  aria-pressed={playersNeeded === n}
                  className={cn(
                    'flex-1 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                    'border',
                    playersNeeded === n
                      ? 'bg-[#E7EFEA] border-[#D2E1D7] text-[#0b0b0b] shadow-[0_0_0_3px_rgba(110,146,119,0.28)]'
                      : 'bg-[#F4F6F5] dark:bg-white/[0.06] border-transparent text-black/[0.72] dark:text-white/[0.88]'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-black/[0.56] dark:text-white/[0.64] mb-2.5">
              Format
            </label>
            <div className="flex flex-wrap gap-2">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormat(option.value)}
                  className={cn(
                    'px-3 py-2 rounded-full text-xs font-medium transition-all',
                    'border',
                    format === option.value
                      ? 'bg-[#E7EFEA] border-[#D2E1D7] text-[#0b0b0b]'
                      : 'bg-white dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.12] text-black/[0.72] dark:text-white/[0.88]'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-black/[0.56] dark:text-white/[0.64] mb-2.5">
              Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 240))}
              placeholder="Add details about the game…"
              maxLength={240}
              className={cn(
                'w-full min-h-[92px] px-3.5 py-3 rounded-2xl text-sm resize-none',
                'bg-[#F4F6F5] dark:bg-white/[0.06]',
                'border border-black/[0.06] dark:border-white/[0.12]',
                'focus:outline-none focus:ring-2 focus:ring-[#6E9277]/30'
              )}
            />
          </div>

          {/* Audience */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-black/[0.56] dark:text-white/[0.64] mb-2.5">
              Audience
            </label>
            <div className="flex gap-2">
              {audienceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAudience(option.value)}
                  aria-pressed={audience === option.value}
                  className={cn(
                    'flex-1 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                    'border',
                    audience === option.value
                      ? 'bg-[#E7EFEA] border-[#D2E1D7] text-[#0b0b0b] shadow-[0_0_0_3px_rgba(110,146,119,0.28)]'
                      : 'bg-[#F4F6F5] dark:bg-white/[0.06] border-transparent text-black/[0.72] dark:text-white/[0.88]'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Push notification toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-black/[0.72] dark:text-white/[0.88]">
              Send push notification
            </label>
            <button
              onClick={() => setPush(!push)}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                push ? 'bg-[#6E9277]' : 'bg-black/[0.12] dark:bg-white/[0.12]'
              )}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-full bg-white shadow-sm transition-transform absolute top-0.5',
                  push ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="border-t border-black/[0.06] dark:border-white/[0.12]"
          style={{
            padding: '12px 16px 16px',
            backdropFilter: 'blur(12px)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.64), #fff 48%)',
          }}
        >
          {error && (
            <div className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={cn(
              'w-full h-12 rounded-2xl font-bold text-white mb-2',
              'bg-[#6E9277] hover:bg-[#6E9277]/90',
              'disabled:opacity-40'
            )}
          >
            {isSubmitting ? 'Sending…' : 'Send request'}
          </Button>
          <button
            onClick={() => {
              // TODO: Implement save preset
              console.log('Save preset');
            }}
            className={cn(
              'w-full h-10 rounded-xl text-sm font-medium',
              'bg-transparent border border-black/[0.06] dark:border-white/[0.12]',
              'text-black/[0.72] dark:text-white/[0.88]',
              'hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            Save preset
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
