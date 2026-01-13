import React from 'react';
import { Button } from '@/components/ui/button';
import { WizardData } from '../types';
import { cn } from '@/lib/utils';

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onNext: () => void;
}

const VISIBILITY_OPTIONS = [
  { value: 'public' as const, label: 'Public', desc: 'Anyone can find and join' },
  { value: 'friends' as const, label: 'Friends', desc: 'Only friends can see' },
  { value: 'invite_only' as const, label: 'Invite Only', desc: 'Only invited people can join' },
  { value: 'private' as const, label: 'Private', desc: 'Hidden, share link to invite' },
];

const SCORING_OPTIONS = [
  { value: 'stableford' as const, label: 'Stableford', desc: 'Points based on par' },
  { value: 'stroke_net' as const, label: 'Stroke (Net)', desc: 'Lowest net score wins' },
  { value: 'stroke_gross' as const, label: 'Stroke (Gross)', desc: 'Lowest gross score wins' },
  { value: 'none' as const, label: 'No Scoring', desc: 'Just for fun' },
];

export function StepSettings({ data, onChange, onNext }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Visibility */}
        <div>
          <h3 className="font-medium mb-3">Who can see this event?</h3>
          <div className="grid grid-cols-2 gap-2">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ visibility: opt.value })}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all',
                  data.visibility === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Scoring */}
        <div>
          <h3 className="font-medium mb-3">Scoring Format</h3>
          <div className="grid grid-cols-2 gap-2">
            {SCORING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ scoringFormat: opt.value })}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all',
                  data.scoringFormat === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Handicap Allowance */}
        {data.scoringFormat !== 'none' && data.scoringFormat !== 'stroke_gross' && (
          <div>
            <h3 className="font-medium mb-3">Handicap Allowance</h3>
            <div className="flex gap-2">
              {[75, 90, 95, 100].map((a) => (
                <button
                  key={a}
                  onClick={() => onChange({ handicapAllowance: a })}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium text-sm border',
                    data.handicapAllowance === a
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card border-border'
                  )}
                >
                  {a}%
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Players receive {data.handicapAllowance}% of their handicap
            </p>
          </div>
        )}

        {/* Max Participants */}
        <div>
          <h3 className="font-medium mb-3">Maximum Participants</h3>
          <div className="flex gap-2">
            {[null, 20, 40, 60].map((max, i) => (
              <button
                key={i}
                onClick={() => onChange({ maxParticipants: max })}
                className={cn(
                  'flex-1 py-3 rounded-xl font-medium text-sm border',
                  data.maxParticipants === max
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card border-border'
                )}
              >
                {max === null ? 'No limit' : max}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-background">
        <Button onClick={onNext} className="w-full h-12 rounded-xl">
          Review Event
        </Button>
      </div>
    </div>
  );
}
