import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardData } from '../types';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onNext: () => void;
}

const TIME_SLOTS = [
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
];

export function StepDateTime({ data, onChange, onNext }: Props) {
  const isMultiDay = data.eventType === 'multi_day';

  const handleStartDateChange = (date: string) => {
    const updates: Partial<WizardData> = { startDate: date };

    if (isMultiDay && data.rounds.length > 0) {
      const startDateObj = new Date(date);
      updates.rounds = data.rounds.map((round, index) => ({
        ...round,
        roundDate: format(addDays(startDateObj, index), 'yyyy-MM-dd'),
      }));
    } else if (data.rounds.length > 0) {
      updates.rounds = data.rounds.map((round) => ({
        ...round,
        roundDate: date,
      }));
    }

    onChange(updates);
  };

  const handleRoundTimeChange = (index: number, time: string) => {
    const updated = [...data.rounds];
    updated[index] = { ...updated[index], firstTeeTime: time };
    onChange({ rounds: updated });
  };

  const canContinue = data.startDate && data.rounds.every((r) => r.firstTeeTime);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Start Date */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            {isMultiDay ? 'Trip Start Date' : 'Date'}
          </label>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
            <Calendar className="w-5 h-5 text-primary" />
            <input
              type="date"
              value={data.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="flex-1 bg-transparent text-foreground"
            />
          </div>
        </div>

        {/* End Date (for multi-day only) */}
        {isMultiDay && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Trip End Date
            </label>
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
              <Calendar className="w-5 h-5 text-primary" />
              <input
                type="date"
                value={data.endDate}
                onChange={(e) => onChange({ endDate: e.target.value })}
                min={data.startDate || format(new Date(), 'yyyy-MM-dd')}
                className="flex-1 bg-transparent text-foreground"
              />
            </div>
          </div>
        )}

        {/* First Tee Time(s) */}
        {data.rounds.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              First Tee Time{data.rounds.length > 1 ? 's' : ''}
            </label>
            <div className="space-y-3">
              {data.rounds.map((round, index) => (
                <div key={index} className="space-y-2">
                  {data.rounds.length > 1 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium">{round.courseName}</span>
                      {isMultiDay && round.roundDate && (
                        <span className="text-muted-foreground">
                          {format(new Date(round.roundDate), 'EEE, MMM d')}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                    <Clock className="w-5 h-5 text-primary" />
                    <select
                      value={round.firstTeeTime}
                      onChange={(e) => handleRoundTimeChange(index, e.target.value)}
                      className="flex-1 bg-transparent text-foreground p-2 border border-border rounded-lg"
                    >
                      <option value="">Select time</option>
                      {TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>
                          {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tee Time Interval (for society days) */}
        {data.eventType === 'society_day' && data.rounds.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Time Between Groups
            </label>
            <div className="flex gap-2">
              {[7, 8, 10, 12].map((interval) => (
                <button
                  key={interval}
                  onClick={() =>
                    onChange({
                      rounds: data.rounds.map((r) => ({ ...r, teeTimeInterval: interval })),
                    })
                  }
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium text-sm border',
                    data.rounds[0]?.teeTimeInterval === interval
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card border-border'
                  )}
                >
                  {interval} min
                </button>
              ))}
            </div>
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
