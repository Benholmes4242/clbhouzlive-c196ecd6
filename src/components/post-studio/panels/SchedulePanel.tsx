// SchedulePanel — Schedule date/time picker, light mode
import React, { useState, useMemo } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, ICON_BG, ICON_COLOR } from '../tokens';

const pad = (n: number) => n.toString().padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function SchedulePanel() {
  const { state, setScheduledAt, closePanel } = usePostStudioContext();
  const dragControls = useDragControls();
  const [isScheduling, setIsScheduling] = useState(state.scheduledAt !== null);

  const minDate = useMemo(() => { const d = new Date(); d.setMinutes(d.getMinutes() + 5); return d; }, []);

  const initDate = state.scheduledAt ?? minDate;
  const [dateValue, setDateValue] = useState(toDateStr(initDate));
  const [timeValue, setTimeValue] = useState(toTimeStr(initDate));

  const combineAndSet = (d: string, t: string) => {
    const combined = new Date(`${d}T${t}`);
    if (!isNaN(combined.getTime()) && combined >= minDate) setScheduledAt(combined);
  };

  const handleToggle = () => {
    if (isScheduling) { setIsScheduling(false); setScheduledAt(null); }
    else { setIsScheduling(true); combineAndSet(dateValue, timeValue); }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30"
        style={{ background: 'rgba(0,0,0,0.25)' }}
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
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
        </div>

        <div className="px-5 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-0.5" style={{ color: TEXT_TERTIARY }}>Schedule</p>
          <h3 className="text-[17px] font-semibold tracking-tight" style={{ color: TEXT_PRIMARY }}>When to post?</h3>
        </div>

        <div className="px-5 pb-8 space-y-3">
          <div
            className="flex items-center justify-between px-4 py-4 rounded-2xl"
            style={{ background: isScheduling ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ICON_BG }}>
                <Clock className="w-5 h-5" style={{ color: ICON_COLOR }} strokeWidth={1.75} />
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
                background: isScheduling ? 'rgba(15,23,42,0.90)' : 'rgba(0,0,0,0.08)',
              }}
            >
              <motion.div
                animate={{ x: isScheduling ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="w-6 h-6 rounded-full"
                style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
              />
            </button>
          </div>

          <AnimatePresence>
            {isScheduling && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2.5 px-1">
                    <Calendar className="w-4 h-4 shrink-0" style={{ color: TEXT_TERTIARY }} strokeWidth={1.75} />
                    <span className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: TEXT_TERTIARY }}>
                      Select date & time
                    </span>
                  </div>

                  <input
                    type="date"
                    value={dateValue}
                    min={toDateStr(new Date())}
                    onChange={(e) => { setDateValue(e.target.value); combineAndSet(e.target.value, timeValue); }}
                    className="w-full px-4 py-3 rounded-xl text-[15px] font-medium outline-none"
                    style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)', color: TEXT_PRIMARY, colorScheme: 'light' }}
                  />

                  <input
                    type="time"
                    value={timeValue}
                    onChange={(e) => { setTimeValue(e.target.value); combineAndSet(dateValue, e.target.value); }}
                    className="w-full px-4 py-3 rounded-xl text-[15px] font-medium outline-none"
                    style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)', color: TEXT_PRIMARY, colorScheme: 'light' }}
                  />

                  {state.scheduledAt && (
                    <p className="px-1 text-xs" style={{ color: TEXT_SECONDARY }}>
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
