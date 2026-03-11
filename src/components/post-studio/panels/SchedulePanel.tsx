// SchedulePanel — Schedule date/time picker bottom sheet

import React, { useState, useMemo } from 'react';
import { X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';

export function SchedulePanel() {
  const { state, setScheduledAt, closePanel } = usePostStudioContext();
  const [isScheduling, setIsScheduling] = useState(state.scheduledAt !== null);

  // Min: 5 minutes from now, Max: 6 months
  const minDate = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    return d;
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  }, []);

  const toDateTimeLocal = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [dateValue, setDateValue] = useState<string>(
    state.scheduledAt ? toDateTimeLocal(state.scheduledAt) : toDateTimeLocal(minDate)
  );

  const handleToggle = () => {
    if (isScheduling) {
      setIsScheduling(false);
      setScheduledAt(null);
    } else {
      setIsScheduling(true);
      const selected = new Date(dateValue);
      if (selected > minDate) {
        setScheduledAt(selected);
      }
    }
  };

  const handleDateChange = (value: string) => {
    setDateValue(value);
    const selected = new Date(value);
    if (selected >= minDate && selected <= maxDate) {
      setScheduledAt(selected);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', ...SPRING.panel }}
      className="absolute inset-x-0 bottom-0 z-40 bg-background rounded-t-[20px] border-t border-border/50 backdrop-blur-xl"
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      <div className="flex items-center justify-between px-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Schedule</h3>
        <button onClick={closePanel} className="w-11 h-11 flex items-center justify-center">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 pb-6 space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {isScheduling ? 'Schedule for later' : 'Post now'}
            </span>
          </div>
          <button
            onClick={handleToggle}
            className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${
              isScheduling ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                isScheduling ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Date picker */}
        {isScheduling && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <input
              type="datetime-local"
              value={dateValue}
              min={toDateTimeLocal(minDate)}
              max={toDateTimeLocal(maxDate)}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-3 text-foreground text-sm outline-none"
            />
            {state.scheduledAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Will be published on{' '}
                {state.scheduledAt.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
