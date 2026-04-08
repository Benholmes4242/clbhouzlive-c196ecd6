// SchedulePanel — Dark sheet, smart quick options, custom drum picker, scheduled posts tab
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Zap, Clock, Calendar, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { usePostStudioContext } from '../usePostStudio';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { useQueryClient } from '@tanstack/react-query';
import { SPRING } from '../constants';
import { format } from 'date-fns';

const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });

type QuickOption = { id: string; label: string; sub: string; icon: React.ReactNode; getDate: () => Date | null };

function getNextWeekendMorning(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSat = day === 6 ? 7 : (6 - day);
  const sat = new Date(now);
  sat.setDate(sat.getDate() + daysUntilSat);
  sat.setHours(8, 0, 0, 0);
  return sat;
}

function getTonightDate(): Date {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  if (d <= new Date()) { d.setDate(d.getDate() + 1); }
  return d;
}

function getTomorrowMorning(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d;
}

const ITEM_H = 44;

function DrumPicker({ items, selectedIndex, onSelect }: { items: string[]; selectedIndex: number; onSelect: (i: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = selectedIndex * ITEM_H;
    }
  }, []);

  return (
    <div className="relative flex-1" style={{ height: ITEM_H * 3, overflow: 'hidden' }}>
      <div className="absolute inset-x-0 pointer-events-none z-10" style={{
        top: ITEM_H, height: ITEM_H,
        background: 'rgba(247,147,30,0.10)',
        border: '1px solid rgba(247,147,30,0.18)',
        borderRadius: 10,
      }} />
      <div className="absolute inset-x-0 top-0 z-20 pointer-events-none" style={{ height: ITEM_H, background: 'linear-gradient(to bottom, #161616, transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none" style={{ height: ITEM_H, background: 'linear-gradient(to top, #161616, transparent)' }} />

      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        style={{ scrollbarWidth: 'none', scrollSnapType: 'y mandatory', paddingTop: ITEM_H, paddingBottom: ITEM_H }}
      >
        {items.map((item, i) => {
          const isSelected = i === selectedIndex;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className="w-full flex items-center justify-center"
              style={{
                height: ITEM_H, scrollSnapAlign: 'center',
                fontSize: isSelected ? 17 : 15,
                fontWeight: isSelected ? 700 : 400,
                color: isSelected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.28)',
                transition: 'all 150ms',
              }}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScheduledPostsList({ scheduledPosts, isLoading, refetch, publishNow, deletePost, isPublishingNow, isDeleting, closePanel }: {
  scheduledPosts: any[]; isLoading: boolean; refetch: () => void;
  publishNow: (id: string) => Promise<any>; deletePost: (id: string) => Promise<any>;
  isPublishingNow: boolean; isDeleting: boolean; closePanel: () => void;
}) {
  const queryClient = useQueryClient();
  useEffect(() => { refetch(); }, []);

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-6" style={{ scrollbarWidth: 'none' }}>
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,255,255,0.10)', borderTopColor: 'transparent' }} />
        </div>
      )}

      {!isLoading && scheduledPosts.length === 0 && (
        <div className="flex flex-col items-center text-center py-10">
          <Clock className="w-6 h-6 mb-2" style={{ color: 'rgba(255,255,255,0.20)' }} strokeWidth={1.5} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.50)' }}>No scheduled posts</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>Posts you schedule will appear here</p>
        </div>
      )}

      {!isLoading && scheduledPosts.map((post, i) => (
        <div
          key={post.id}
          className="flex items-center gap-3"
          style={{
            padding: '12px 0',
            borderBottom: i < scheduledPosts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}
        >
          <div className="flex-1 min-w-0">
            <p style={{
              fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {post.content || 'No caption'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {post.scheduledAt ? format(new Date(post.scheduledAt), "EEE d MMM · h:mm a") : ''}
            </p>
          </div>

          <button
            onClick={async () => {
              try {
                await publishNow(post.id);
                queryClient.invalidateQueries({ queryKey: ['media-feed'] });
                queryClient.invalidateQueries({ queryKey: ['media-feed', 'suggested'] });
                queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
                queryClient.invalidateQueries({ queryKey: ['scheduled-posts-count'] });
                closePanel();
                toast.success('Your post is now live');
              } catch {
                // error toast handled by hook
              }
            }}
            disabled={isPublishingNow}
            className="flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(247,147,30,0.10)',
              border: '1px solid rgba(247,147,30,0.22)',
              borderRadius: 20,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: '#F7931E',
            }}
          >
            Post now
          </button>

          <button
            onClick={() => deletePost(post.id)}
            disabled={isDeleting}
            className="flex items-center justify-center shrink-0"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
            }}
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: 'rgba(239,68,68,0.70)' }} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
}

type Tab = 'schedule' | 'scheduled';

export function SchedulePanel() {
  const { state, setScheduledAt, closePanel, schedulePublishRef } = usePostStudioContext();
  const dragControls = useDragControls();
  const [showDrumPicker, setShowDrumPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('schedule');

  const { scheduledPosts, isLoading, refetch, deletePost, publishNow, isDeleting, isPublishing: isPublishingNow } = useScheduledPosts();

  const now = useMemo(() => new Date(), []);

  const quickOptions: QuickOption[] = useMemo(() => [
    { id: 'now', label: 'Post now', sub: 'Goes live immediately', icon: <Zap className="w-4 h-4" />, getDate: () => null },
    { id: '1h', label: 'In 1 hour', sub: fmt(new Date(now.getTime() + 3600000)), icon: <Clock className="w-4 h-4" />, getDate: () => new Date(now.getTime() + 3600000) },
    { id: 'tonight', label: 'Tonight', sub: '8:00 PM', icon: <Clock className="w-4 h-4" />, getDate: getTonightDate },
    { id: 'tomorrow', label: 'Tomorrow morning', sub: '8:00 AM', icon: <Clock className="w-4 h-4" />, getDate: getTomorrowMorning },
    { id: 'weekend', label: 'This weekend', sub: 'Sat 8:00 AM', icon: <Clock className="w-4 h-4" />, getDate: getNextWeekendMorning },
    { id: 'custom', label: 'Pick a time', sub: 'Choose date & time', icon: <Calendar className="w-4 h-4" />, getDate: () => null },
  ], [now]);

  const activeId = useMemo(() => {
    if (!state.scheduledAt) return 'now';
    for (const opt of quickOptions) {
      if (opt.id === 'now' || opt.id === 'custom') continue;
      const d = opt.getDate();
      if (d && Math.abs(d.getTime() - state.scheduledAt.getTime()) < 60000) return opt.id;
    }
    return 'custom';
  }, [state.scheduledAt, quickOptions]);

  // Drum picker state
  const dayLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    }
    return labels;
  }, [now]);

  const hourLabels = useMemo(() => {
    const labels: string[] = [];
    for (let h = 6; h <= 22; h++) {
      labels.push(h <= 12 ? `${h === 0 ? 12 : h} AM` : `${h - 12} PM`);
    }
    return labels;
  }, []);

  const minuteLabels = ['00', '15', '30', '45'];

  const [dayIdx, setDayIdx] = useState(0);
  const [hourIdx, setHourIdx] = useState(2);
  const [minIdx, setMinIdx] = useState(0);

  const handleQuickSelect = useCallback((opt: QuickOption) => {
    if (opt.id === 'custom') {
      setShowDrumPicker(true);
      return;
    }
    const d = opt.getDate();
    setScheduledAt(d);
  }, [setScheduledAt]);

  const handleDrumConfirm = useCallback(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayIdx);
    d.setHours(6 + hourIdx, parseInt(minuteLabels[minIdx]), 0, 0);
    setScheduledAt(d);
    setShowDrumPicker(false);
  }, [now, dayIdx, hourIdx, minIdx, setScheduledAt]);

  const handleCTA = useCallback(() => {
    if (state.scheduledAt) {
      if (state.mediaItems.length === 0) {
        toast.error('Add a photo or video before scheduling');
        closePanel();
        return;
      }
      schedulePublishRef.current = true;
      // Re-set scheduledAt to trigger the useEffect in ComposeScreen
      setScheduledAt(new Date(state.scheduledAt.getTime()));
    }
    closePanel();
  }, [closePanel, state.scheduledAt, state.mediaItems.length, schedulePublishRef, setScheduledAt]);

  const scheduledCount = scheduledPosts.length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30"
        style={{ background: 'rgba(0,0,0,0.55)' }}
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
        className="absolute inset-x-0 bottom-0 z-40 flex flex-col"
        style={{
          background: '#161616',
          borderRadius: '20px 20px 0 0',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          maxHeight: '80vh',
        }}
      >
        <div
          className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>Schedule</p>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>When to post?</h3>
          </div>
          <button
            onClick={closePanel}
            className="flex items-center justify-center shrink-0"
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.45)' }} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 px-5 pb-4">
          {(['schedule', 'scheduled'] as Tab[]).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === 'schedule' ? 'Schedule' : 'Scheduled';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex items-center gap-1.5"
                style={{
                  padding: '7px 14px', borderRadius: 20,
                  fontSize: 13, fontWeight: 600,
                  background: isActive ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
                  border: isActive ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.08)',
                  color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.40)',
                }}
              >
                {label}
                {tab === 'scheduled' && scheduledCount > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
                    borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: '#F7931E', color: '#fff', padding: '0 4px',
                  }}>
                    {scheduledCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', minHeight: 0 }}>
          {activeTab === 'schedule' ? (
            <AnimatePresence mode="wait">
              {showDrumPicker ? (
                <motion.div
                  key="drum"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-5 pb-4"
                >
                  <button
                    onClick={() => setShowDrumPicker(false)}
                    className="flex items-center gap-1 mb-4"
                    style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.50)' }}
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>

                  <div className="flex gap-2 mb-4">
                    <DrumPicker items={dayLabels} selectedIndex={dayIdx} onSelect={setDayIdx} />
                    <DrumPicker items={hourLabels} selectedIndex={hourIdx} onSelect={setHourIdx} />
                    <DrumPicker items={minuteLabels} selectedIndex={minIdx} onSelect={setMinIdx} />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDrumConfirm}
                    className="w-full flex items-center justify-center"
                    style={{
                      background: '#F7931E', borderRadius: 16,
                      fontSize: 15, fontWeight: 700, color: '#fff',
                      minHeight: 48,
                    }}
                  >
                    Confirm time
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="quick"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="px-5 pb-4"
                >
                  <div className="flex flex-col gap-1.5">
                    {quickOptions.map((opt) => {
                      const isActive = activeId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleQuickSelect(opt)}
                          className="w-full flex items-center gap-3"
                          style={{
                            padding: '12px 14px', borderRadius: 14,
                            background: isActive ? 'rgba(247,147,30,0.10)' : 'rgba(255,255,255,0.04)',
                            border: isActive ? '1px solid rgba(247,147,30,0.28)' : '1px solid transparent',
                          }}
                        >
                          <div className="shrink-0 flex items-center justify-center" style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: isActive ? 'rgba(247,147,30,0.15)' : 'rgba(255,255,255,0.06)',
                            color: isActive ? '#F7931E' : 'rgba(255,255,255,0.40)',
                          }}>
                            {opt.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>{opt.label}</p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>{opt.sub}</p>
                          </div>
                          {opt.id === 'custom' && <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.20)' }} />}
                          {isActive && opt.id !== 'custom' && (
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#F7931E' }} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Confirmation line */}
                  {state.scheduledAt && (
                    <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl" style={{
                      background: 'rgba(247,147,30,0.07)', border: '1px solid rgba(247,147,30,0.14)',
                    }}>
                      <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: '#F7931E' }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(247,147,30,0.80)' }}>
                        Will post {fmtDate(state.scheduledAt)}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <ScheduledPostsList
              scheduledPosts={scheduledPosts}
              isLoading={isLoading}
              refetch={refetch}
              publishNow={publishNow}
              deletePost={deletePost}
              isPublishingNow={isPublishingNow}
              isDeleting={isDeleting}
              closePanel={closePanel}
            />
          )}
        </div>

        {/* CTA — always pinned to bottom */}
        {activeTab === 'schedule' && !showDrumPicker && (
          <div style={{
            flexShrink: 0,
            padding: '12px 20px',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(22,22,22,0.98)',
          }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCTA}
              className="w-full flex items-center justify-center"
              style={{
                borderRadius: 16, fontSize: 15, fontWeight: 700, minHeight: 48,
                background: state.scheduledAt ? '#F7931E' : 'rgba(255,255,255,0.08)',
                color: state.scheduledAt ? '#fff' : 'rgba(255,255,255,0.55)',
                boxShadow: state.scheduledAt ? '0 4px 20px rgba(247,147,30,0.28)' : 'none',
              }}
            >
              {state.scheduledAt ? 'Schedule post' : 'Post now'}
            </motion.button>
          </div>
        )}
      </motion.div>
    </>
  );
}
