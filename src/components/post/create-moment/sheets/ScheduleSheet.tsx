// Schedule post sheet - Polished iOS-style date/time picker
// Tall enough to show all content, drag handle, refined calendar

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, addMonths, isBefore, isAfter, startOfDay, setHours, setMinutes, isToday } from "date-fns";
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
  
  // Generate calendar days for current view month
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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[10000]"
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl border-t border-border z-[10001] flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4">
              <h2 className="text-xl font-semibold text-foreground">Schedule Post</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* Calendar container */}
              <div className="bg-card rounded-2xl p-4 border border-border">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePrevMonth}
                    className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <span className="font-semibold text-foreground">
                    {format(viewMonth, "MMMM yyyy")}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, idx) => {
                    const isValid = isDateValid(date);
                    const isSelected = date && 
                      format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                    const isTodayDate = date && isToday(date);
                    
                    return date ? (
                      <button
                        key={idx}
                        disabled={!isValid}
                        onClick={() => date && isValid && setSelectedDate(date)}
                        className={cn(
                          "aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-colors mx-auto w-10 h-10",
                          isSelected && "bg-foreground text-background",
                          !isSelected && !isValid && "text-muted-foreground/30 cursor-not-allowed",
                          !isSelected && isValid && "hover:bg-muted text-foreground",
                          isTodayDate && !isSelected && "text-blue-500 font-bold"
                        )}
                      >
                        {date.getDate()}
                      </button>
                    ) : (
                      <div key={idx} className="aspect-square" />
                    );
                  })}
                </div>
              </div>
              
              {/* Time Picker */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Select Time</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Hour */}
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                    className="flex-1 h-14 rounded-xl bg-card border border-border text-center text-2xl font-semibold text-foreground appearance-none cursor-pointer focus:border-foreground focus:ring-1 focus:ring-foreground outline-none transition-all"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  
                  <span className="text-2xl font-bold text-muted-foreground">:</span>
                  
                  {/* Minute */}
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                    className="flex-1 h-14 rounded-xl bg-card border border-border text-center text-2xl font-semibold text-foreground appearance-none cursor-pointer focus:border-foreground focus:ring-1 focus:ring-foreground outline-none transition-all"
                  >
                    {[0, 15, 30, 45].map(m => (
                      <option key={m} value={m}>
                        {m.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  Timezone: {timezone}
                </p>
              </div>
              
              {/* Summary Card */}
              <div className="mt-4 p-4 bg-muted rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {format(scheduledDateTime, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(scheduledDateTime, "h:mm a")}
                    </p>
                  </div>
                </div>
                
                {!isValidScheduleTime && (
                  <p className="text-xs text-red-500 mt-3">
                    Schedule must be at least 15 minutes from now
                  </p>
                )}
              </div>
            </div>
            
            {/* Footer - Action button */}
            <div className="p-4 pt-0 pb-safe">
              <button
                onClick={handleSchedule}
                disabled={!isValidScheduleTime || isScheduling}
                className="w-full h-14 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-200"
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
