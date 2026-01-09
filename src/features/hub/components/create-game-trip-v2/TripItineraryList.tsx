/**
 * TripItineraryList - Timeline list of courses on the trip
 * Day labels, reorder handle (UI only), + Add another course
 */

import React from 'react';
import { MapPin, Plus, GripVertical, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';
import type { TripCourseStop } from './types';

interface TripItineraryListProps {
  itinerary: TripCourseStop[];
  onAddCourse: () => void;
  onEditCourse: (stop: TripCourseStop) => void;
  onReorder?: (newOrder: TripCourseStop[]) => void;
}

export function TripItineraryList({ 
  itinerary, 
  onAddCourse, 
  onEditCourse,
  onReorder,
}: TripItineraryListProps) {
  if (itinerary.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-3"
    >
      <span 
        className="text-[12px] font-medium tracking-wide block px-1"
        style={{ color: 'var(--hub-text-dim)' }}
      >
        Courses on this trip
      </span>

      <Reorder.Group
        axis="y"
        values={itinerary}
        onReorder={onReorder || (() => {})}
        className="space-y-2"
      >
        <AnimatePresence mode="popLayout">
          {itinerary.map((stop, index) => (
            <Reorder.Item
              key={stop.id}
              value={stop}
              className="touch-none"
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  haptic('light');
                  onEditCourse(stop);
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
                }}
              >
                {/* Drag handle */}
                <div 
                  className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'none' }}
                >
                  <GripVertical className="w-4 h-4" style={{ color: 'var(--hub-text-dimmer)' }} />
                </div>

                {/* Day badge */}
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(110, 146, 119, 0.12) 0%, rgba(110, 146, 119, 0.06) 100%)',
                    border: '1px solid rgba(110, 146, 119, 0.15)',
                  }}
                >
                  <span 
                    className="text-[11px] font-bold"
                    style={{ color: '#6E9277' }}
                  >
                    Day {stop.dayIndex + 1}
                  </span>
                </div>

                {/* Course info */}
                <div className="flex-1 min-w-0">
                  <div 
                    className="text-[14px] font-semibold truncate"
                    style={{ color: 'var(--hub-text)' }}
                  >
                    {stop.courseName}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {stop.courseLocation && (
                      <span 
                        className="text-[12px] truncate"
                        style={{ color: 'var(--hub-text-dim)' }}
                      >
                        {stop.courseLocation}
                      </span>
                    )}
                    {stop.playDateTime && (
                      <>
                        <span style={{ color: 'var(--hub-text-dimmer)' }}>•</span>
                        <span 
                          className="text-[12px]"
                          style={{ color: 'var(--hub-text-dim)' }}
                        >
                          {format(stop.playDateTime, 'h:mm a')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--hub-text-dimmer)' }} />
              </motion.button>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Add another course */}
      <button
        onClick={() => {
          haptic('light');
          onAddCourse();
        }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-[0.98]"
        style={{
          border: '1px dashed rgba(0, 0, 0, 0.12)',
          background: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        <Plus className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
        <span 
          className="text-[13px] font-medium"
          style={{ color: 'var(--hub-text-sub)' }}
        >
          Add another course
        </span>
      </button>
    </motion.div>
  );
}
