import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';
import '@/styles/frosted-buttons.css';

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  onClose: () => void;
}

export function DateTimePicker({ value, onChange, onClose }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value || undefined);
  const [selectedTime, setSelectedTime] = useState<string>(
    value ? format(value, 'HH:mm') : '12:00'
  );

  const handleConfirm = () => {
    if (selectedDate) {
      const [hours, minutes] = selectedTime.split(':');
      const dateTime = new Date(selectedDate);
      dateTime.setHours(parseInt(hours), parseInt(minutes));
      onChange(dateTime);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">Choose Date & Time</h3>
        
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className={cn("rounded-lg bg-neutral-800/50 border border-neutral-700 pointer-events-auto")}
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/90">Time</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full py-2 px-4 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              onPointerDown={(e) => {
                try { haptic('light'); } catch {}
                (e.currentTarget as HTMLButtonElement).classList.add('is-tapping');
                setTimeout(() => (e.currentTarget as HTMLButtonElement).classList.remove('is-tapping'), 200);
              }}
              className="frosted-btn cancel pressable flex-1 py-2 px-4 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedDate}
              onPointerDown={(e) => {
                try { haptic('light'); } catch {}
                (e.currentTarget as HTMLButtonElement).classList.add('is-tapping');
                setTimeout(() => (e.currentTarget as HTMLButtonElement).classList.remove('is-tapping'), 200);
              }}
              className="frosted-btn pressable flex-1 py-2 px-4 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
