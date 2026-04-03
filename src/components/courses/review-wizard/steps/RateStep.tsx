/**
 * Step 1: Rate Your Experience
 * Compact course row + amber-fill sliders with animated values
 * Hero variant for overall, compact variant for categories
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getScoreTier } from '@/utils/getScoreTier';
import { triggerHaptic } from '@/lib/ui/haptics';
import { formatCourseLocation } from '@/utils/courseLocation';
import type { ReviewBreakdowns } from '../types';
import type { ReviewWizardCourse } from '../types';

interface RateStepProps {
  rating: number | null;
  breakdowns: ReviewBreakdowns;
  course: ReviewWizardCourse | null;
  onRatingChange: (rating: number) => void;
  onBreakdownChange: (key: keyof ReviewBreakdowns, value: number | null) => void;
}

const BREAKDOWN_FIELDS = [
  { key: 'design' as const, label: 'Course Design', description: 'Layout, design and landscape' },
  { key: 'condition' as const, label: 'Course Condition', description: 'Greens, fairways, and overall upkeep' },
  { key: 'clubhouse' as const, label: 'Clubhouse & Service', description: 'Clubhouse, changing rooms and staff friendliness' },
  { key: 'facilities' as const, label: 'Practice Facilities', description: 'Range, putting green, and amenities' },
];

function snapToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

/* ─── Segmented Track Slider ─── */
interface SegmentedSliderProps {
  value: number;
  onChange: (value: number) => void;
  touched: boolean;
  onFirstTouch: () => void;
  size: 'hero' | 'compact';
  ariaLabel: string;
}

function SegmentedSlider({ value, onChange, touched, onFirstTouch, size, ariaLabel }: SegmentedSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const prevWholeRef = useRef<number>(Math.floor(value));

  const trackHeight = size === 'hero' ? 8 : 6;
  const thumbSize = size === 'hero' ? 28 : 22;
  const thumbActiveSize = size === 'hero' ? 32 : 26;

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return snapToTenth(ratio * 10);
  }, [value]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    triggerHaptic('light');
    if (!touched) {
      onFirstTouch();
    }
    const newValue = getValueFromPosition(e.clientX);
    prevWholeRef.current = Math.floor(newValue);
    onChange(newValue);
  }, [touched, onFirstTouch, getValueFromPosition, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    const newValue = getValueFromPosition(e.clientX);
    const newWhole = Math.floor(newValue);
    if (newWhole !== prevWholeRef.current) {
      triggerHaptic('light');
      prevWholeRef.current = newWhole;
    }
    onChange(newValue);
  }, [isDragging, getValueFromPosition, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!touched) onFirstTouch();
      const newVal = Math.min(10, snapToTenth((value ?? 5) + 0.1));
      onChange(newVal);
      triggerHaptic('light');
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!touched) onFirstTouch();
      const newVal = Math.max(0, snapToTenth((value ?? 5) - 0.1));
      onChange(newVal);
      triggerHaptic('light');
    }
  }, [value, touched, onFirstTouch, onChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const percent = (value / 10) * 100;
  const tierData = touched ? getScoreTier(value) : null;

  return (
    <div
      className="relative w-full select-none"
      style={{ touchAction: 'none' }}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuenow={touched ? value : undefined}
      aria-valuetext={touched && tierData ? `${value.toFixed(1)} out of 10, ${tierData.label}` : 'Not set'}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Track container with touch area */}
      <div
        ref={trackRef}
        className="relative w-full cursor-pointer"
        style={{ height: thumbSize + 16, paddingTop: (thumbSize + 16 - trackHeight) / 2, paddingBottom: (thumbSize + 16 - trackHeight) / 2 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Track background */}
        <div
          className="absolute left-0 right-0"
          style={{
            height: trackHeight,
            borderRadius: trackHeight / 2,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'hsl(var(--muted))',
          }}
        />
        {/* Track fill — amber gradient */}
        <div
          className="absolute left-0"
          style={{
            height: trackHeight,
            borderRadius: trackHeight / 2,
            width: `${percent}%`,
            top: '50%',
            transform: 'translateY(-50%)',
            background: size === 'hero'
              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              : '#f59e0b',
            transition: isDragging ? 'none' : 'width 50ms ease',
          }}
        />
        {/* Thumb — white with amber border */}
        <div
          style={{
            position: 'absolute',
            width: isDragging ? thumbActiveSize : thumbSize,
            height: isDragging ? thumbActiveSize : thumbSize,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            borderWidth: isDragging ? 3 : 2,
            borderStyle: 'solid',
            borderColor: '#f59e0b',
            boxShadow: isDragging
              ? '0 0 0 4px rgba(245, 158, 11, 0.15), 0 2px 8px rgba(0,0,0,0.1)'
              : '0 1px 3px rgba(0,0,0,0.1)',
            left: `${percent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            transition: isDragging ? 'none' : 'width 100ms ease, height 100ms ease, box-shadow 100ms ease, border-width 100ms ease',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export function RateStep({ 
  rating, 
  breakdowns, 
  course,
  onRatingChange, 
  onBreakdownChange 
}: RateStepProps) {
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    BREAKDOWN_FIELDS.forEach(({ key }) => {
      if (breakdowns[key] !== null && breakdowns[key] !== undefined) {
        initial[key] = true;
      }
    });
    return initial;
  });

  useEffect(() => {
    BREAKDOWN_FIELDS.forEach(({ key }) => {
      if (breakdowns[key] !== null && breakdowns[key] !== undefined) {
        setTouchedFields(prev => {
          if (prev[key]) return prev;
          return { ...prev, [key]: true };
        });
      }
    });
  }, [breakdowns]);

  const handleOverallChange = useCallback((val: number) => {
    onRatingChange(val);
  }, [onRatingChange]);

  const handleBreakdownChange = useCallback((key: keyof ReviewBreakdowns, val: number) => {
    setTouchedFields(prev => ({ ...prev, [key]: true }));
    onBreakdownChange(key, val);
  }, [onBreakdownChange]);

  const locationText = course ? formatCourseLocation({
    sub_country: course.sub_country,
    region: course.region,
    country: course.country,
  }) : '';

  const overallTier = rating !== null ? getScoreTier(rating) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="shrink-0"
      style={{ background: 'transparent' }}
    >
      {/* Compact course row */}
      {course && (
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
          {course.thumbnail_image ? (
            <img
              src={course.thumbnail_image}
              alt={course.name}
              loading="eager"
              className="w-14 h-14 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-blue-500 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground text-[15px] truncate">{course.name}</p>
            {locationText && (
              <p className="text-sm text-muted-foreground truncate">{locationText}</p>
            )}
          </div>
        </div>
      )}

      {/* Overall Rating — hero treatment */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-center text-lg font-semibold text-foreground">Your Verdict</p>
        
        {/* Animated value display */}
        <div className="flex justify-center py-4">
          <motion.span
            key={(rating ?? 5).toFixed(1)}
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="text-5xl font-bold tabular-nums leading-none"
            style={{ color: getScoreTier(rating ?? 5).accent }}
          >
            {rating !== null ? rating.toFixed(1) : '5.0'}
          </motion.span>
        </div>

        {/* Tier label */}
        {overallTier && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm font-semibold text-muted-foreground mb-3"
          >
            {overallTier.label}
          </motion.p>
        )}

        <SegmentedSlider
          value={rating ?? 5}
          onChange={handleOverallChange}
          touched={true}
          onFirstTouch={() => {}}
          size="hero"
          ariaLabel="Overall rating"
        />
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-border/40" />

      {/* Category Ratings */}
      <div className="px-4 pt-4">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[1.5px] mb-2">
          Rate each area
        </p>
        
        {BREAKDOWN_FIELDS.map(({ key, label, description }, index) => {
          const score = breakdowns[key];
          const isTouched = touchedFields[key];
          
          return (
            <div key={key}>
              {index > 0 && (
                <div className="mx-4 h-px bg-border/40" />
              )}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.25 }}
                className="py-3"
              >
                {/* Label + value inline */}
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[15px] font-bold text-foreground">{label}</p>
                  {isTouched && score !== null ? (
                    <motion.span
                      key={score?.toFixed(1)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-lg font-bold tabular-nums"
                      style={{ color: getScoreTier(score).accent }}
                    >
                      {score?.toFixed(1)}
                    </motion.span>
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground/30">—</span>
                  )}
                </div>
                
                <SegmentedSlider
                  value={score ?? 5}
                  onChange={(val) => handleBreakdownChange(key, val)}
                  touched={isTouched}
                  onFirstTouch={() => setTouchedFields(prev => ({ ...prev, [key]: true }))}
                  size="compact"
                  ariaLabel={`${label} rating`}
                />
                
                <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>
              </motion.div>
            </div>
          );
        })}
      </div>
      
      {/* Bottom spacer */}
      <div className="h-8" aria-hidden="true" />
    </motion.div>
  );
}
