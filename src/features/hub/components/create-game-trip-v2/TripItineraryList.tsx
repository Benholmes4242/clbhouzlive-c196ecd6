/**
 * TripItineraryList - Timeline list of courses on the trip
 * Day badges as soft green pills, drag handle, course cards with hover lift
 * V2: Added course removal with X button
 */

import React from 'react';
import { Plus, GripVertical, X } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';
import type { TripCourseStop } from './types';

interface TripItineraryListProps {
  itinerary: TripCourseStop[];
  onAddCourse: () => void;
  onEditCourse: (stop: TripCourseStop) => void;
  onReorder?: (newOrder: TripCourseStop[]) => void;
  onRemoveCourse?: (stopId: string) => void;
}

export function TripItineraryList({ 
  itinerary, 
  onAddCourse, 
  onEditCourse,
  onReorder,
  onRemoveCourse,
}: TripItineraryListProps) {
  if (itinerary.length === 0) return null;

  const handleRemove = (e: React.MouseEvent, stopId: string) => {
    e.stopPropagation();
    haptic('medium');
    onRemoveCourse?.(stopId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="space-y-3"
    >
      <span 
        className="text-[12px] font-medium tracking-wide uppercase block px-1"
        style={{ color: '#94a3b8' }}
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
          {itinerary.map((stop) => (
            <Reorder.Item
              key={stop.id}
              value={stop}
              className="touch-none"
            >
              <motion.div
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)' }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                }}
              >
                {/* Drag handle */}
                <div 
                  className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'none' }}
                >
                  <GripVertical className="w-4 h-4" style={{ color: '#cbd5e1' }} />
                </div>

                {/* Day badge - soft green pill */}
                <div 
                  className="px-2.5 py-1.5 rounded-full flex-shrink-0"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                  }}
                >
                  <span 
                    className="text-[11px] font-bold"
                    style={{ color: '#16a34a' }}
                  >
                    Day {stop.dayIndex + 1}
                  </span>
                </div>

                {/* Course info - tappable for edit */}
                <button
                  onClick={() => {
                    haptic('light');
                    onEditCourse(stop);
                  }}
                  className="flex-1 min-w-0 text-left"
                >
                  <div 
                    className="text-[14px] font-semibold truncate"
                    style={{ color: '#1e293b' }}
                  >
                    {stop.courseName}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {stop.courseLocation && (
                      <span 
                        className="text-[12px] truncate"
                        style={{ color: '#64748b' }}
                      >
                        {stop.courseLocation}
                      </span>
                    )}
                    {stop.playDateTime && (
                      <>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span 
                          className="text-[12px]"
                          style={{ color: '#64748b' }}
                        >
                          {format(stop.playDateTime, 'h:mm a')}
                        </span>
                      </>
                    )}
                  </div>
                </button>

                {/* Remove button */}
                <button
                  onClick={(e) => handleRemove(e, stop.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-all duration-150 active:scale-90"
                  style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                  aria-label="Remove course"
                >
                  <X 
                    className="w-4 h-4 transition-colors" 
                    style={{ color: '#94a3b8' }} 
                  />
                </button>
              </motion.div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Add another course - center aligned, dashed border, larger icon */}
      <button
        onClick={() => {
          haptic('light');
          onAddCourse();
        }}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl transition-all active:scale-[0.98] hover:bg-white/80"
        style={{
          border: '2px dashed rgba(0, 0, 0, 0.1)',
          background: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        <Plus className="w-5 h-5" style={{ color: '#64748b' }} />
        <span 
          className="text-[14px] font-medium"
          style={{ color: '#64748b' }}
        >
          Add another course
        </span>
      </button>
    </motion.div>
  );
}
