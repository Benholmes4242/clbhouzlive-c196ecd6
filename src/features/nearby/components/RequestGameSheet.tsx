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
      <div className="max-h-[78vh] flex flex-col">
        {/* Header */}
        <header
          className="flex items-center justify-between border-b shrink-0"
          style={{ padding: '12px 20px', borderColor: 'var(--border-mid)' }}
        >
          <h2 id="request-game-title" className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Request a game
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2"
            style={{ background: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-overlay)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </header>

        {/* Scrollable content */}
        <div className="px-4 pb-2 grow overflow-y-auto overscroll-contain"  style={{ paddingTop: '12px' }}>
          {/* When */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold mb-2.5" style={{ color: 'var(--text-secondary)' }}>
              When
            </label>
            <div className="flex gap-2">
              {whenOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setWhen(option.value)}
                  aria-pressed={when === option.value}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={when === option.value ? {
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  } : {
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-mid)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Where */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold mb-2.5" style={{ color: 'var(--text-secondary)' }}>
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
              className="w-full px-3.5 py-3 rounded-2xl text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#6E9277]/30"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-mid)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Players needed */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold mb-2.5" style={{ color: 'var(--text-secondary)' }}>
              Players needed
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setPlayersNeeded(n as 1 | 2 | 3)}
                  aria-pressed={playersNeeded === n}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={playersNeeded === n ? {
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  } : {
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-mid)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold mb-2.5" style={{ color: 'var(--text-secondary)' }}>
              Format
            </label>
            <div className="flex flex-wrap gap-2">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormat(option.value)}
                  className="px-3 py-2 rounded-full text-xs font-medium transition-all"
                  style={format === option.value ? {
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  } : {
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-mid)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold mb-2.5" style={{ color: 'var(--text-secondary)' }}>
              Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 240))}
              placeholder="Add details about the game…"
              maxLength={240}
              className="w-full min-h-[92px] px-3.5 py-3 rounded-2xl text-sm resize-none placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#6E9277]/30"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-mid)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Audience */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold mb-2.5" style={{ color: 'var(--text-secondary)' }}>
              Audience
            </label>
            <div className="flex gap-2">
              {audienceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAudience(option.value)}
                  aria-pressed={audience === option.value}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={audience === option.value ? {
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  } : {
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-mid)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Push notification toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Send push notification
            </label>
            <button
              onClick={() => setPush(!push)}
              className="w-11 h-6 rounded-full transition-colors relative"
              style={{
                backgroundColor: push ? '#6E9277' : 'rgba(255,255,255,0.12)',
              }}
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

        {/* Sticky footer */}
        <footer
          className="px-4 pt-2 pb-4 shrink-0 sticky bottom-0"
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid var(--border-mid)',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          }}
        >
          {error && (
            <div className="mb-3 text-sm text-red-400">{error}</div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 rounded-2xl font-bold mb-2 transition-colors"
            style={{
              backgroundColor: isValid && !isSubmitting ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
              color: 'white',
              border: isValid && !isSubmitting ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              cursor: isValid && !isSubmitting ? 'pointer' : 'not-allowed',
            }}
          >
            {isSubmitting ? 'Sending…' : 'Send request'}
          </button>
          <button
            onClick={() => {
              // TODO: Implement save preset
              console.log('Save preset');
            }}
            className="w-full h-10 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--accent-frost-hover)]"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
            }}
          >
            Save preset
          </button>
        </footer>
      </div>
    </BottomSheet>
  );
}
