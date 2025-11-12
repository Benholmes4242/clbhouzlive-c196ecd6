import React, { useState } from 'react';
import { format, startOfToday, startOfWeek, endOfWeek, subDays, startOfDay, endOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { X, CalendarIcon } from 'lucide-react';

type DatePreset = 'today' | 'this_week' | 'last_week' | 'last_30d' | 'custom' | null;

interface DateFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (from: Date | null, to: Date | null, preset: DatePreset) => void;
  currentFrom?: Date | null;
  currentTo?: Date | null;
}

export const DateFilterSheet: React.FC<DateFilterSheetProps> = ({
  isOpen,
  onClose,
  onApply,
  currentFrom,
  currentTo,
}) => {
  const [preset, setPreset] = useState<DatePreset>(null);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(currentFrom || undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(currentTo || undefined);
  const [showCustom, setShowCustom] = useState(false);

  const presets = [
    { id: 'today', label: 'Today' },
    { id: 'this_week', label: 'This week' },
    { id: 'last_week', label: 'Last week' },
    { id: 'last_30d', label: 'Last 30 days' },
  ] as const;

  const getPresetDates = (p: DatePreset): { from: Date; to: Date } | null => {
    const today = startOfToday();
    switch (p) {
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'this_week':
        return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'last_week': {
        const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        return { from: lastWeekStart, to: lastWeekEnd };
      }
      case 'last_30d':
        return { from: startOfDay(subDays(today, 30)), to: endOfDay(today) };
      default:
        return null;
    }
  };

  const handlePresetClick = (p: DatePreset) => {
    setPreset(p);
    setShowCustom(false);
    const dates = getPresetDates(p);
    if (dates) {
      onApply(dates.from, dates.to, p);
      onClose();
    }
  };

  const handleCustom = () => {
    setShowCustom(true);
    setPreset('custom');
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onApply(startOfDay(customFrom), endOfDay(customTo), 'custom');
      onClose();
    }
  };

  const handleClear = () => {
    setPreset(null);
    setCustomFrom(undefined);
    setCustomTo(undefined);
    onApply(null, null, null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-[101] animate-in slide-in-from-bottom duration-200">
        <div className="p-6 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Filter by date</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Presets */}
          {!showCustom && (
            <div className="space-y-2 mb-4">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetClick(p.id as DatePreset)}
                  className={cn(
                    'w-full px-4 py-3 text-left rounded-xl transition-all',
                    preset === p.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 hover:bg-muted text-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={handleCustom}
                className="w-full px-4 py-3 text-left rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-all flex items-center gap-2"
              >
                <CalendarIcon className="w-4 h-4" />
                Custom range
              </button>
            </div>
          )}

          {/* Custom Date Pickers */}
          {showCustom && (
            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">From</label>
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  className="pointer-events-auto rounded-xl border border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">To</label>
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  disabled={(date) => customFrom ? date < customFrom : false}
                  className="pointer-events-auto rounded-xl border border-border"
                />
              </div>
              <button
                onClick={handleCustomApply}
                disabled={!customFrom || !customTo}
                className={cn(
                  'w-full px-4 py-3 rounded-xl font-medium transition-all',
                  customFrom && customTo
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                Apply custom range
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-all font-medium"
            >
              Clear filter
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
