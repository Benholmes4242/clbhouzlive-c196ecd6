// SchedulePanel — Schedule date/time picker, dark spec
import React, { useState, useMemo } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import { AMBER, AMBER_DIM, AMBER_GHOST, AMBER_GRADIENT, TEXT_PRIMARY, TEXT_TERTIARY } from '../tokens';

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

  const [dateValue, setDateValue] = useState<string>(
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
        className="absolute inset-0 z-30"
        style={{ background: 'rgba(0,0,0,0.50)' }}
        onClick={closePanel}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', ...SPRING.panel }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_e, info) => {
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
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {/* Header — no X button */}
        <div className="px-5 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Schedule
          </p>
          <h3 className="text-[17px] font-semibold tracking-tight" style={{ color: TEXT_PRIMARY }}>
            When to post?
          </h3>
        </div>

        <div className="px-5 pb-8 space-y-3">
          {/* Toggle row */}
          <div
            className="flex items-center justify-between px-4 py-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <Clock className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.55)' }} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>
                  {isScheduling ? 'Schedule for later' : 'Post now'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: TEXT_TERTIARY }}>
                  {isScheduling ? 'Choose a date and time' : 'Goes live immediately'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="flex items-center px-0.5 transition-all"
              style={{
                width: 48, height: 28, borderRadius: 99,
                background: isScheduling ? AMBER_GRADIENT : 'rgba(255,255,255,0.12)',
              }}
            >
              <motion.div
                animate={{ x: isScheduling ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="w-6 h-6 rounded-full"
                style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.30)' }}
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
                transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
                >
                  <div className="flex items-center gap-2.5 px-4 pt-3 pb-1">
                    <Calendar className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.40)' }} strokeWidth={1.75} />
                    <span className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
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
                    <p className="px-4 pb-3 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
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