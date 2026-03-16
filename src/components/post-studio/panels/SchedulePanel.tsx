// SchedulePanel — Schedule date/time picker, dark spec
import React, { useState, useMemo } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import { AMBER, AMBER_DIM, AMBER_GHOST, AMBER_GRADIENT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '../tokens';

export function SchedulePanel() {
  const { state, setScheduledAt, closePanel } = usePostStudioContext();
  const dragControls = useDragControls();
  const [isScheduling, setIsScheduling] = useState(state.scheduledAt !== null);

  const minDate = useMemo(() => { const d = new Date(); d.setMinutes(d.getMinutes() + 5); return d; }, []);
  const maxDate = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() + 6); return d; }, []);

  const toDateTimeLocal = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [dateValue, setDateValue] = useState(
    state.scheduledAt ? toDateTimeLocal(state.scheduledAt) : toDateTimeLocal(minDate)
  );

  const handleToggle = () => {
    if (isScheduling) { setIsScheduling(false); setScheduledAt(null); }
    else { setIsScheduling(true); const selected = new Date(dateValue); if (selected > minDate) setScheduledAt(selected); }
  };

  const handleDateChange = (value: string) => {
    setDateValue(value);
    const selected = new Date(value);
    if (selected >= minDate && selected <= maxDate) setScheduledAt(selected);
  };

  return (
    <>
      {/* Tap-outside backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closePanel}
        className="absolute inset-0 z-30"
        style={{ background: 'rgba(0,0,0,0.45)' }}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', ...SPRING.panel }}
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80 || info.velocity.y > 400) closePanel();
        }}
        className="absolute inset-x-0 bottom-0 z-40 rounded-t-[24px]"
        style={{
          background: 'rgba(13,13,13,0.99)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.20)' }} />
        </div>

        {/* Header — no X */}
        <div className="px-5 pb-4 pt-1">
          <p
            className="text-[11px] font-semibold uppercase tracking-[1.5px]"
            style={{ color: AMBER_DIM }}
          >
            Schedule
          </p>
          <h3 className="text-base font-semibold mt-0.5" style={{ color: TEXT_PRIMARY }}>
            When to post?
          </h3>
        </div>

        <div className="px-5 pb-8 space-y-4">
          {/* Toggle row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: isScheduling ? 'rgba(232,152,10,0.12)' : 'rgba(255,255,255,0.06)' }}
              >
                <Clock
                  className="w-5 h-5"
                  style={{ color: isScheduling ? AMBER : 'rgba(255,255,255,0.50)' }}
                  strokeWidth={1.75}
                />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
                  {isScheduling ? 'Schedule for later' : 'Post now'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: TEXT_TERTIARY }}>
                  {isScheduling ? 'Choose a date and time' : 'Goes live immediately'}
                </p>
              </div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={handleToggle}
              className="w-12 h-7 rounded-full flex items-center px-0.5 transition-colors"
              style={{ background: isScheduling ? AMBER : 'rgba(255,255,255,0.12)' }}
            >
              <div
                className="w-6 h-6 rounded-full shadow transition-transform"
                style={{
                  background: '#FFFFFF',
                  transform: isScheduling ? 'translateX(20px)' : 'translateX(0px)',
                }}
              />
            </button>
          </div>

          {/* Date picker */}
          <AnimatePresence>
            {isScheduling && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                    <Calendar className="w-3.5 h-3.5" style={{ color: TEXT_TERTIARY }} strokeWidth={2} />
                    <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: TEXT_TERTIARY }}>
                      Select date & time
                    </span>
                  </div>
                  <input
                    type="datetime-local"
                    value={dateValue}
                    min={toDateTimeLocal(minDate)}
                    max={toDateTimeLocal(maxDate)}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-sm outline-none"
                    style={{
                      color: TEXT_PRIMARY,
                      caretColor: AMBER,
                      colorScheme: 'dark',
                    }}
                  />
                  {state.scheduledAt && (
                    <p className="px-4 pb-3 text-xs" style={{ color: AMBER_DIM }}>
                      Will post {state.scheduledAt.toLocaleDateString('en-GB', {
                        weekday: 'long', day: 'numeric', month: 'long',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
