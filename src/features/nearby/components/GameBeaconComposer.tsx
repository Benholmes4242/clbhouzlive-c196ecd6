import React, { useState } from 'react';
import { X, Clock, MapPin, Users, MessageSquare, Bell } from 'lucide-react';
import { GameBeaconDraft, BeaconAudience, BeaconFormat } from '../types';
import { Button } from '@/components/ui/button';

interface GameBeaconComposerProps {
  onSubmit: (draft: GameBeaconDraft) => void;
  onCancel: () => void;
  initialDraft?: Partial<GameBeaconDraft>;
}

const formatOptions: { value: BeaconFormat; label: string }[] = [
  { value: '9', label: '9 holes' },
  { value: '18', label: '18 holes' },
  { value: 'range', label: 'Range' },
  { value: 'casual', label: 'Casual' },
  { value: 'stroke', label: 'Stroke play' },
  { value: 'scramble', label: 'Scramble' },
];

const audienceOptions: { value: BeaconAudience; label: string }[] = [
  { value: 'followers', label: 'Followers' },
  { value: 'friends', label: 'Friends' },
  { value: 'nearby', label: 'Nearby' },
  { value: 'custom', label: 'Custom...' },
];

export function GameBeaconComposer({ onSubmit, onCancel, initialDraft }: GameBeaconComposerProps) {
  const [draft, setDraft] = useState<Partial<GameBeaconDraft>>({
    when: 'now',
    whereClubId: '',
    playersNeeded: 1,
    formats: ['casual'],
    notes: '',
    audience: 'nearby',
    visibilityWindowMin: 120,
    sendPush: true,
    ...initialDraft,
  });

  const handleSubmit = () => {
    if (!draft.whereClubId || !draft.playersNeeded) {
      return;
    }
    onSubmit(draft as GameBeaconDraft);
  };

  const isValid = draft.whereClubId && draft.playersNeeded;

  return (
    <div className="fixed inset-0 z-[1402] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Create game beacon</h2>
        <button onClick={onCancel} className="p-2 hover:bg-muted rounded-full">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* When */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Clock size={16} className="text-muted-foreground" />
            When
          </label>
          <div className="flex gap-2">
            {['now', '30m', '1h'].map((opt) => (
              <button
                key={opt}
                onClick={() => setDraft({ ...draft, when: opt as any })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  draft.when === opt
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {opt === 'now' ? 'Now' : opt === '30m' ? 'In 30 min' : 'In 1 hour'}
              </button>
            ))}
          </div>
        </div>

        {/* Where */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <MapPin size={16} className="text-muted-foreground" />
            Where
          </label>
          <input
            type="text"
            placeholder="Select club..."
            value={draft.whereClubId}
            onChange={(e) => setDraft({ ...draft, whereClubId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-background"
          />
        </div>

        {/* Players needed */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Users size={16} className="text-muted-foreground" />
            Players needed
          </label>
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setDraft({ ...draft, playersNeeded: n as any })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  draft.playersNeeded === n
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Format</label>
          <div className="flex flex-wrap gap-2">
            {formatOptions.map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => {
                  const current = draft.formats || [];
                  const next = current.includes(fmt.value)
                    ? current.filter((f) => f !== fmt.value)
                    : [...current, fmt.value];
                  setDraft({ ...draft, formats: next });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  draft.formats?.includes(fmt.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare size={16} className="text-muted-foreground" />
            Notes (optional)
          </label>
          <textarea
            placeholder="Add details about the game..."
            value={draft.notes || ''}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-background min-h-[80px]"
          />
        </div>

        {/* Audience */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Audience</label>
          <div className="flex gap-2">
            {audienceOptions.map((aud) => (
              <button
                key={aud.value}
                onClick={() => setDraft({ ...draft, audience: aud.value })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  draft.audience === aud.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {aud.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notify */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Bell size={16} className="text-muted-foreground" />
            Send push notification
          </label>
          <button
            onClick={() => setDraft({ ...draft, sendPush: !draft.sendPush })}
            className={`w-11 h-6 rounded-full transition-colors ${
              draft.sendPush ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                draft.sendPush ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t space-y-2">
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full"
          style={{ background: '#6e9277' }}
        >
          Send game beacon
        </Button>
        <button
          onClick={onCancel}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Save preset
        </button>
      </div>
    </div>
  );
}
