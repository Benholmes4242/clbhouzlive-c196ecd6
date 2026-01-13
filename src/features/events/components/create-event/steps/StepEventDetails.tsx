import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { WizardData } from '../types';

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onNext: () => void;
}

export function StepEventDetails({ data, onChange, onNext }: Props) {
  const canContinue = data.name.trim().length > 0;

  const placeholders: Record<WizardData['eventType'], string> = {
    single_round: 'e.g., Saturday Morning Round',
    society_day: 'e.g., Annual Company Golf Day',
    multi_day: 'e.g., Portugal Golf Trip 2026',
    tournament: 'e.g., Club Championship 2026',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Event Name *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={placeholders[data.eventType]}
            className="w-full p-4 bg-card rounded-xl border border-border text-lg"
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Description (optional)
          </label>
          <Textarea
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Add details about your event..."
            className="min-h-[120px] resize-none"
          />
        </div>

        {data.eventType === 'society_day' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="font-medium text-amber-800 mb-2">💡 Society Day Tips</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• You can add unlimited players</li>
              <li>• Players will be auto-grouped into foursomes</li>
              <li>• Tee times are generated automatically</li>
            </ul>
          </div>
        )}

        {data.eventType === 'multi_day' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-medium text-blue-800 mb-2">🌍 Golf Trip Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Add multiple courses for each day</li>
              <li>• Invite friends to join your trip</li>
              <li>• Track scores across all rounds</li>
            </ul>
          </div>
        )}

        {data.eventType === 'tournament' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="font-medium text-green-800 mb-2">🏆 Tournament Tips</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Set up formal scoring rules</li>
              <li>• Live leaderboard for all participants</li>
              <li>• Automatic handicap calculations</li>
            </ul>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-background">
        <Button onClick={onNext} disabled={!canContinue} className="w-full h-12 rounded-xl">
          Continue
        </Button>
      </div>
    </div>
  );
}
