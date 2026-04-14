/**
 * Step 1: Rate Your Experience
 * Dispatch-styled course row + amber-fill sliders with animated values
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
          {course.thumbnail_image ? (
            <img
              src={course.thumbnail_image}
              alt={course.name}
              loading="eager"
              style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(15,23,42,0.06)', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.name}</div>
            {locationText && <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locationText}</div>}
          </div>
        </div>
      )}

      {/* Overall Rating — hero treatment */}
      <div style={{ padding: '24px 16px 16px' }}>
        {/* Dispatch eyebrow */}
        <div style={{ textAlign: 'center', fontSize: 8.5, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
          ⚡ Your Verdict
        </div>

        {/* Large animated score */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <motion.span
            key={(rating ?? 5).toFixed(1)}
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: getScoreTier(rating ?? 5).accent }}
          >
            {rating !== null ? rating.toFixed(1) : '5.0'}
          </motion.span>
        </div>

        {/* Tier label */}
        {overallTier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#94A3B8', marginBottom: 12 }}
          >
            {overallTier.label}
          </motion.div>
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
      <div style={{ margin: '0 16px', height: 0.5, background: 'rgba(15,23,42,0.07)' }} />

      {/* Category Ratings */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 3, height: 12, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 8.5, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>Rate each area</span>
        </div>
        
        {BREAKDOWN_FIELDS.map(({ key, label, description }, index) => {
          const score = breakdowns[key];
          const isTouched = touchedFields[key];
          
          return (
            <div key={key}>
              {index > 0 && (
                <div style={{ height: 0.5, background: 'rgba(15,23,42,0.07)' }} />
              )}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.25 }}
                style={{ padding: '12px 0' }}
              >
                {/* Label + description + value inline */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{label}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{description}</div>
                  </div>
                  {isTouched && score !== null ? (
                    <motion.span
                      key={score?.toFixed(1)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: getScoreTier(score).accent, flexShrink: 0, marginLeft: 8 }}
                    >
                      {score?.toFixed(1)}
                    </motion.span>
                  ) : (
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(15,23,42,0.12)', flexShrink: 0, marginLeft: 8 }}>—</span>
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
