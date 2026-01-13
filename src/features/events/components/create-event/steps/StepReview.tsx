import React from 'react';
import { Calendar, MapPin, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardData, WizardStep } from '../types';
import { format } from 'date-fns';

interface Props {
  data: WizardData;
  onEdit: (step: WizardStep) => void;
  onCreate: () => void;
  isCreating: boolean;
}

const LABELS = {
  type: {
    single_round: 'Single Round',
    society_day: 'Society Day',
    multi_day: 'Golf Trip',
    tournament: 'Tournament',
  },
  scoring: {
    stableford: 'Stableford',
    stroke_net: 'Stroke (Net)',
    stroke_gross: 'Stroke (Gross)',
    none: 'No Scoring',
  },
  visibility: {
    public: 'Public',
    friends: 'Friends Only',
    club: 'Club Only',
    invite_only: 'Invite Only',
    private: 'Private',
  },
};

export function StepReview({ data, onEdit, onCreate, isCreating }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Event Name & Type */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                {LABELS.type[data.eventType]}
              </span>
              <h2 className="text-xl font-bold mt-2">{data.name}</h2>
            </div>
            <button
              onClick={() => onEdit('details')}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {data.description && (
            <p className="text-sm text-muted-foreground mt-2">{data.description}</p>
          )}
        </div>

        {/* Date */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {data.startDate && format(new Date(data.startDate), 'EEEE, MMMM d, yyyy')}
                </p>
                {data.endDate && data.endDate !== data.startDate && (
                  <p className="text-sm text-muted-foreground">
                    to {format(new Date(data.endDate), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => onEdit('datetime')}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Rounds */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">
              {data.rounds.length} Round{data.rounds.length !== 1 ? 's' : ''}
            </h3>
            <button
              onClick={() => onEdit('course')}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-2">
            {data.rounds.map((round, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{round.courseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {round.roundDate && format(new Date(round.roundDate), 'EEE, MMM d')} •{' '}
                    {round.firstTeeTime &&
                      format(new Date(`2000-01-01T${round.firstTeeTime}`), 'h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Settings</h3>
            <button
              onClick={() => onEdit('settings')}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-muted px-2 py-1 rounded-full">
              {LABELS.visibility[data.visibility]}
            </span>
            <span className="text-xs bg-muted px-2 py-1 rounded-full">
              {LABELS.scoring[data.scoringFormat]}
            </span>
            <span className="text-xs bg-muted px-2 py-1 rounded-full">
              {data.maxParticipants ? `Max ${data.maxParticipants}` : 'Unlimited'} players
            </span>
            {data.scoringFormat !== 'none' && data.scoringFormat !== 'stroke_gross' && (
              <span className="text-xs bg-muted px-2 py-1 rounded-full">
                {data.handicapAllowance}% HCP
              </span>
            )}
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-medium mb-2">What happens next?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Your event will be created as a draft</li>
            <li>✓ You can invite players via link or search</li>
            <li>✓ Players will be auto-grouped into foursomes</li>
            <li>✓ Publish when ready to notify everyone</li>
          </ul>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-background">
        <Button
          onClick={onCreate}
          disabled={isCreating}
          className="w-full h-12 rounded-xl"
        >
          {isCreating ? 'Creating...' : 'Create Event'}
        </Button>
      </div>
    </div>
  );
}
