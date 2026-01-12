// Schedule post sheet - date/time picker for scheduling posts
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, addMonths, isBefore, isAfter, startOfDay, setHours, setMinutes } from "date-fns";

interface ScheduleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledAt: Date) => void;
  isScheduling?: boolean;
  initialDate?: Date; // For edit mode - pre-fill with existing scheduled time
}

// Constants
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
  
  // Use initialDate if provided (edit mode), otherwise use current time
  const defaultDate = initialDate || now;
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);
  const [selectedHour, setSelectedHour] = useState(defaultDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(
    initialDate ? defaultDate.getMinutes() : Math.ceil(now.getMinutes() / 15) * 15 % 60
  );
  const [viewMonth, setViewMonth] = useState(defaultDate);
  
  // Generate calendar days for current view month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before first of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    
    return days;
  }, [viewMonth]);
  
  // Check if a date is valid for selection
  const isDateValid = (date: Date | null) => {
    if (!date) return false;
    const dayStart = startOfDay(date);
    return !isBefore(dayStart, startOfDay(minDate)) && !isAfter(dayStart, maxDate);
  };
  
  // Build final scheduled datetime
  const scheduledDateTime = useMemo(() => {
    let dt = startOfDay(selectedDate);
    dt = setHours(dt, selectedHour);
    dt = setMinutes(dt, selectedMinute);
    return dt;
  }, [selectedDate, selectedHour, selectedMinute]);
  
  // Validate the combined datetime is at least 15 minutes in future
  const isValidScheduleTime = useMemo(() => {
    const minTime = new Date(now.getTime() + MIN_MINUTES_FROM_NOW * 60 * 1000);
    return isAfter(scheduledDateTime, minTime);
  }, [scheduledDateTime, now]);
  
  // Get user's timezone
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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[10000]"
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-[10001] max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-lg font-semibold">Schedule Post</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="font-medium">
                  {format(viewMonth, "MMMM yyyy")}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-6">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                  <div key={day} className="text-center text-xs text-muted-foreground py-2">
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
                      className={`
                        aspect-square flex items-center justify-center rounded-full text-sm
                        transition-colors
                        ${!date ? "invisible" : ""}
                        ${!isValid ? "text-muted-foreground/40 cursor-not-allowed" : "hover:bg-muted"}
                        ${isSelected ? "bg-primary text-primary-foreground" : ""}
                        ${isToday && !isSelected ? "ring-1 ring-primary" : ""}
                      `}
                    >
                      {date?.getDate()}
                    </button>
                  );
                })}
              </div>
              
              {/* Time Picker */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={16} />
                  <span>Select Time</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Hour */}
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                    className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 text-base font-medium appearance-none cursor-pointer"
                    style={{ 
                      color: '#1f2937', 
                      backgroundColor: '#ffffff',
                      WebkitAppearance: 'menulist',
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i} style={{ color: '#1f2937' }}>
                        {i.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  
                  <span className="text-lg font-medium">:</span>
                  
                  {/* Minute */}
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                    className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 text-base font-medium appearance-none cursor-pointer"
                    style={{ 
                      color: '#1f2937', 
                      backgroundColor: '#ffffff',
                      WebkitAppearance: 'menulist',
                    }}
                  >
                    {[0, 15, 30, 45].map(m => (
                      <option key={m} value={m} style={{ color: '#1f2937' }}>
                        {m.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Timezone display */}
                <p className="text-xs text-muted-foreground">
                  Timezone: {timezone}
                </p>
              </div>
              
              {/* Selected DateTime Summary */}
              <div className="mt-6 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-primary" />
                  <span className="font-medium">
                    {format(scheduledDateTime, "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Clock size={16} className="text-primary" />
                  <span className="font-medium">
                    {format(scheduledDateTime, "h:mm a")}
                  </span>
                </div>
                
                {!isValidScheduleTime && (
                  <p className="text-xs text-destructive mt-2">
                    Schedule must be at least 15 minutes from now
                  </p>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-border">
              <button
                onClick={handleSchedule}
                disabled={!isValidScheduleTime || isScheduling}
                className={`
                  w-full py-3 rounded-full font-medium text-white
                  transition-all
                  ${isValidScheduleTime && !isScheduling
                    ? "bg-primary hover:bg-primary/90" 
                    : "bg-muted-foreground/50 cursor-not-allowed"
                  }
                `}
              >
                {isScheduling ? "Scheduling..." : "Schedule Post"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
