// Schedule post sheet - Premium glass design
// Clean frosted glass aesthetic with unified visual language
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, addMonths, isBefore, isAfter, startOfDay, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface ScheduleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledAt: Date) => void;
  isScheduling?: boolean;
  initialDate?: Date;
}

const MIN_MINUTES_FROM_NOW = 15;
const MAX_DAYS_AHEAD = 90;

export default function ScheduleSheet({ 
  isOpen, 
  onClose, 
  onSchedule,
  isScheduling = false,
  initialDate
}: ScheduleSheetProps) {
  const now = new Date();
  const minDate = addDays(startOfDay(now), 0);
  const maxDate = addDays(startOfDay(now), MAX_DAYS_AHEAD);
  
  const defaultDate = initialDate || now;
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);
  const [selectedHour, setSelectedHour] = useState(defaultDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(
    initialDate ? defaultDate.getMinutes() : Math.ceil(now.getMinutes() / 15) * 15 % 60
  );
  const [viewMonth, setViewMonth] = useState(defaultDate);
  
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    return days;
  }, [viewMonth]);
  
  const isDateValid = (date: Date | null) => {
    if (!date) return false;
    const dayStart = startOfDay(date);
    return !isBefore(dayStart, startOfDay(minDate)) && !isAfter(dayStart, maxDate);
  };
  
  const scheduledDateTime = useMemo(() => {
    let dt = startOfDay(selectedDate);
    dt = setHours(dt, selectedHour);
    dt = setMinutes(dt, selectedMinute);
    return dt;
  }, [selectedDate, selectedHour, selectedMinute]);
  
  const isValidScheduleTime = useMemo(() => {
    const minTime = new Date(now.getTime() + MIN_MINUTES_FROM_NOW * 60 * 1000);
    return isAfter(scheduledDateTime, minTime);
  }, [scheduledDateTime, now]);
  
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const handleSchedule = () => {
    if (!isValidScheduleTime || isScheduling) return;
    onSchedule(scheduledDateTime);
  };
  
  const handlePrevMonth = () => {
    const prev = addMonths(viewMonth, -1);
    if (!isBefore(startOfDay(new Date(prev.getFullYear(), prev.getMonth() + 1, 0)), minDate)) {
      setViewMonth(prev);
    }
  };
  
  const handleNextMonth = () => {
    const next = addMonths(viewMonth, 1);
    if (!isAfter(new Date(next.getFullYear(), next.getMonth(), 1), maxDate)) {
      setViewMonth(next);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000]"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="absolute bottom-0 left-0 right-0 rounded-t-[28px] max-h-[85vh] overflow-hidden flex flex-col"
            style={{ 
              background: 'var(--cm-surface-card)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12)',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-300/60" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--cm-text-primary)' }}>
                  Schedule Post
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--cm-text-tertiary)' }}>
                  Choose when to publish
                </p>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  "bg-slate-100/80 dark:bg-slate-800/80",
                  "backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50",
                  "transition-all duration-200 active:scale-95"
                )}
              >
                <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
              {/* Calendar Card */}
              <div 
                className="rounded-2xl p-4"
                style={{ 
                  background: 'var(--cm-surface-alt)',
                  border: '1px solid var(--cm-border-subtle)',
                }}
              >
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePrevMonth}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center",
                      "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md",
                      "border border-slate-200/50 dark:border-slate-700/50",
                      "transition-all duration-200 active:scale-95"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
                  </button>
                  <span className="font-semibold text-sm" style={{ color: 'var(--cm-text-primary)' }}>
                    {format(viewMonth, "MMMM yyyy")}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center",
                      "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md",
                      "border border-slate-200/50 dark:border-slate-700/50",
                      "transition-all duration-200 active:scale-95"
                    )}
                  >
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
                  </button>
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                    <div 
                      key={day} 
                      className="text-center text-[11px] font-medium uppercase tracking-wider py-2"
                      style={{ color: 'var(--cm-text-tertiary)' }}
                    >
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((date, idx) => {
                    const isValid = isDateValid(date);
                    const isSelected = date && 
                      format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                    const isToday = date && 
                      format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
                    
                    return (
                      <button
                        key={idx}
                        disabled={!isValid}
                        onClick={() => date && isValid && setSelectedDate(date)}
                        className={cn(
                          "w-10 h-10 flex items-center justify-center rounded-full text-sm mx-auto",
                          "transition-all duration-200",
                          !date && "invisible",
                          !isValid && "opacity-30 cursor-not-allowed",
                          isValid && !isSelected && "hover:bg-slate-200/50 dark:hover:bg-slate-700/50",
                          isSelected && "bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold shadow-lg",
                          isToday && !isSelected && "ring-2 ring-orange-500/30"
                        )}
                        style={{ 
                          color: isSelected ? 'white' : isValid ? 'var(--cm-text-primary)' : 'var(--cm-text-tertiary)'
                        }}
                      >
                        {date?.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Time Picker Card */}
              <div 
                className="rounded-2xl p-4"
                style={{ 
                  background: 'var(--cm-surface-alt)',
                  border: '1px solid var(--cm-border-subtle)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" style={{ color: 'var(--cm-icon-secondary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--cm-text-primary)' }}>
                    Select Time
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                    className={cn(
                      "flex-1 h-12 px-4 rounded-xl text-base font-medium",
                      "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md",
                      "border border-slate-200/50 dark:border-slate-700/50",
                      "focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400/50",
                      "transition-all duration-200 appearance-none cursor-pointer"
                    )}
                    style={{ color: 'var(--cm-text-primary)' }}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  
                  <span className="text-xl font-bold" style={{ color: 'var(--cm-text-tertiary)' }}>:</span>
                  
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                    className={cn(
                      "flex-1 h-12 px-4 rounded-xl text-base font-medium",
                      "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md",
                      "border border-slate-200/50 dark:border-slate-700/50",
                      "focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400/50",
                      "transition-all duration-200 appearance-none cursor-pointer"
                    )}
                    style={{ color: 'var(--cm-text-primary)' }}
                  >
                    {[0, 15, 30, 45].map(m => (
                      <option key={m} value={m}>
                        {m.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
                
                <p className="text-xs mt-2" style={{ color: 'var(--cm-text-tertiary)' }}>
                  Timezone: {timezone}
                </p>
              </div>
              
              {/* Summary Strip */}
              <div 
                className="rounded-xl p-4 flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.04))',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(245, 158, 11, 0.15)' }}
                >
                  <Calendar className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--cm-text-primary)' }}>
                    {format(scheduledDateTime, "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--cm-text-secondary)' }}>
                    {format(scheduledDateTime, "h:mm a")}
                  </p>
                </div>
              </div>
              
              {!isValidScheduleTime && (
                <p className="text-xs text-center px-4" style={{ color: 'var(--cm-text-error, #ef4444)' }}>
                  Schedule must be at least 15 minutes from now
                </p>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-5 pt-2 pb-4">
              <button
                onClick={handleSchedule}
                disabled={!isValidScheduleTime || isScheduling}
                className={cn(
                  "w-full h-12 rounded-2xl font-semibold text-base",
                  "transition-all duration-200 active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                style={{
                  background: isValidScheduleTime 
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                    : 'var(--cm-surface-alt)',
                  color: isValidScheduleTime ? 'white' : 'var(--cm-text-tertiary)',
                  boxShadow: isValidScheduleTime 
                    ? '0 4px 16px rgba(245, 158, 11, 0.25)' 
                    : 'none',
                }}
              >
                {isScheduling ? "Scheduling..." : "Schedule Post"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
