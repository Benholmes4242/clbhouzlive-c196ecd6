import React from 'react';
import { Users, Calendar, Plane, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardData } from '../types';

interface Props {
  value: WizardData['eventType'];
  onChange: (type: WizardData['eventType']) => void;
  onNext: () => void;
}

const EVENT_TYPES = [
  {
    type: 'single_round' as const,
    icon: Calendar,
    title: 'Single Round',
    description: 'A standard game for 2-4 players',
    example: 'Saturday morning with friends',
  },
  {
    type: 'society_day' as const,
    icon: Users,
    title: 'Society Day',
    description: 'Multiple groups, same course, same day',
    example: 'Company golf day, club competition',
  },
  {
    type: 'multi_day' as const,
    icon: Plane,
    title: 'Golf Trip',
    description: 'Multi-day trip with multiple rounds',
    example: 'Portugal golf tour, buddies trip',
  },
  {
    type: 'tournament' as const,
    icon: Trophy,
    title: 'Tournament',
    description: 'Competitive event with formal scoring',
    example: 'Club championship, charity event',
  },
];

export function StepEventType({ value, onChange, onNext }: Props) {
  const handleSelect = (type: WizardData['eventType']) => {
    onChange(type);
    onNext();
  };

  return (
    <div className="p-4 pb-24">
      <p className="text-muted-foreground text-center mb-6">
        Choose the type of golf event you're organizing
      </p>

      <div className="space-y-3">
        {EVENT_TYPES.map((eventType) => {
          const Icon = eventType.icon;
          const isSelected = value === eventType.type;

          return (
            <button
              key={eventType.type}
              onClick={() => handleSelect(eventType.type)}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/50'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{eventType.title}</h3>
                  <p className="text-sm text-muted-foreground">{eventType.description}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    e.g., {eventType.example}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
