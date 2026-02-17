/**
 * Step 1: Rate Your Experience
 * Modern segmented amber-fill track sliders with large numeric displays
 * 0.5 increment snap, tier labels, premium custom feel
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getScoreTier } from '@/utils/getScoreTier';
import type { ReviewBreakdowns } from '../types';

interface RateStepProps {
  rating: number | null;
  breakdowns: ReviewBreakdowns;
  onRatingChange: (rating: number) => void;
  onBreakdownChange: (key: keyof ReviewBreakdowns, value: number | null) => void;
}

const BREAKDOWN_FIELDS = [
  { key: 'design' as const, label: 'Course Design', description: 'Layout, design and landscape' },
  { key: 'condition' as const, label: 'Course Condition', description: 'Greens, fairways, and overall upkeep' },
  { key: 'clubhouse' as const, label: 'Clubhouse & Service', description: 'Clubhouse, changing rooms and staff friendliness' },
  { key: 'facilities' as const, label: 'Practice Facilities', description: 'Range, putting green, and amenities' },
];

function getTierLabel(value: number): string {
  if (value >= 10) return 'PERFECT';
  if (value >= 9) return 'EXCELLENT';
  if (value >= 7.5) return 'VERY GOOD';
  if (value >= 6) return 'GOOD';
  if (value >= 4) return 'FAIR';
  if (value >= 2) return 'BELOW AVERAGE';
  return 'POOR';
}

/** Snap to nearest 0.5 */
function snapToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/* ─── Segmented Track Slider ─── */
interface SegmentedSliderProps {
  value: number;
  onChange: (value: number) => void;
  touched: boolean;
  onFirstTouch: () => void;
  size: 'hero' | 'compact';
}

function SegmentedSlider({ value, onChange, touched, onFirstTouch, size }: SegmentedSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showNumber, setShowNumber] = useState(touched);

  const trackHeight = size === 'hero' ? 8 : 6;
  const thumbSize = size === 'hero' ? 24 : 20;
  const thumbActiveSize = size === 'hero' ? 28 : 24;
  const numberSize = size === 'hero' ? 48 : 32;

  useEffect(() => {
    if (touched) setShowNumber(true);
  }, [touched]);

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return snapToHalf(ratio * 10);
  }, [value]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    if (!touched) {
      onFirstTouch();
      setShowNumber(true);
    }
    const newValue = getValueFromPosition(e.clientX);
    onChange(newValue);
  }, [touched, onFirstTouch, getValueFromPosition, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    const newValue = getValueFromPosition(e.clientX);
    onChange(newValue);
  }, [isDragging, getValueFromPosition, onChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const percent = (value / 10) * 100;
  const displayValue = touched ? value.toFixed(1) : '—';
  const tierLabel = touched ? getTierLabel(value) : '';
  const isOutstanding = touched && value >= 9;

  return (
    <div className="relative w-full select-none" style={{ touchAction: 'none' }}>
      {/* Number display above slider */}
      <div className="flex flex-col items-center mb-2" style={{ marginLeft: `calc(${percent}% - 30px)`, width: 60 }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={displayValue}
            initial={touched ? { opacity: 0, scale: 0.8 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="font-bold tabular-nums leading-none"
            style={{
              fontSize: numberSize,
              color: isOutstanding ? '#f59e0b' : '#1F2937',
              ...(isOutstanding ? { textShadow: '0 1px 8px rgba(245, 158, 11, 0.25)' } : {}),
            }}
          >
            {displayValue}
          </motion.span>
        </AnimatePresence>
        {size === 'hero' && (
          <span
            className="text-[11px] font-semibold uppercase tracking-wider mt-0.5"
            style={{ color: '#92400E' }}
          >
            {touched ? 'YOUR RATING' : ''}
          </span>
        )}
      </div>

      {/* Tier label (hero only) */}
      {size === 'hero' && touched && (
        <div className="flex justify-center mb-3">
          <AnimatePresence mode="wait">
            <motion.span
              key={tierLabel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[13px] font-bold uppercase"
              style={{
                color: isOutstanding ? '#f59e0b' : '#D97706',
              }}
            >
              {tierLabel}
            </motion.span>
          </AnimatePresence>
        </div>
      )}

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
            backgroundColor: '#E5E7EB',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
        {/* Track fill */}
        <div
          className="absolute left-0"
          style={{
            height: trackHeight,
            borderRadius: trackHeight / 2,
            background: 'linear-gradient(to right, #F59E0B, #D97706)',
            width: `${percent}%`,
            top: '50%',
            transform: 'translateY(-50%)',
            transition: isDragging ? 'none' : 'width 50ms ease',
          }}
        />
        {/* Thumb */}
        <div
          className="absolute"
          style={{
            width: isDragging ? thumbActiveSize : thumbSize,
            height: isDragging ? thumbActiveSize : thumbSize,
            borderRadius: '50%',
            backgroundColor: 'white',
            border: `${isDragging ? 3 : 2}px solid #D97706`,
            boxShadow: isDragging
              ? '0 2px 6px rgba(0,0,0,0.2)'
              : '0 1px 3px rgba(0,0,0,0.15)',
            left: `${percent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            transition: isDragging ? 'none' : 'width 100ms ease, height 100ms ease, box-shadow 100ms ease, border-width 100ms ease',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Scale labels — 0 and 10 only */}
      <div className="flex justify-between mt-1" aria-hidden="true">
        <span className="text-[9px] text-gray-400 tabular-nums">0</span>
        <span className="text-[9px] text-gray-400 tabular-nums">10</span>
      </div>
    </div>
  );
}

export function RateStep({ 
  rating, 
  breakdowns, 
  onRatingChange, 
  onBreakdownChange 
}: RateStepProps) {
  const [overallTouched, setOverallTouched] = useState(() => rating !== null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    BREAKDOWN_FIELDS.forEach(({ key }) => {
      if (breakdowns[key] !== null && breakdowns[key] !== undefined) {
        initial[key] = true;
      }
    });
    return initial;
  });

  // Handle async loading of breakdown values in edit mode
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

  useEffect(() => {
    if (rating !== null && !overallTouched) {
      setOverallTouched(true);
    }
  }, [rating]);

  const handleOverallChange = useCallback((val: number) => {
    onRatingChange(val);
  }, [onRatingChange]);

  const handleBreakdownChange = useCallback((key: keyof ReviewBreakdowns, val: number) => {
    setTouchedFields(prev => ({ ...prev, [key]: true }));
    onBreakdownChange(key, val);
  }, [onBreakdownChange]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="shrink-0 px-4 pt-6"
      style={{ background: 'transparent' }}
    >
      {/* Main Rating Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-6 text-center">
          Your overall rating
        </h2>
        
        <SegmentedSlider
          value={rating ?? 5}
          onChange={handleOverallChange}
          touched={overallTouched}
          onFirstTouch={() => setOverallTouched(true)}
          size="hero"
        />
      </div>

      {/* Amber section divider */}
      <div className="mx-0 h-px my-4" style={{ backgroundColor: '#FCD34D' }} />

      {/* Sub-Category Ratings */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-5">
          Rate each area
        </h3>
        
        <div className="space-y-0">
          {BREAKDOWN_FIELDS.map(({ key, label, description }, index) => {
            const score = breakdowns[key];
            const isTouched = touchedFields[key];
            
            return (
              <React.Fragment key={key}>
                {index > 0 && (
                  <div className="h-px my-1" style={{ backgroundColor: 'rgba(252, 211, 77, 0.4)' }} />
                )}
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.25 }}
                  style={{ paddingTop: 12, paddingBottom: 4 }}
                >
                  <p className="text-[15px] font-bold text-gray-900 mb-0.5">{label}</p>
                  
                  <SegmentedSlider
                    value={score ?? 5}
                    onChange={(val) => handleBreakdownChange(key, val)}
                    touched={isTouched}
                    onFirstTouch={() => setTouchedFields(prev => ({ ...prev, [key]: true }))}
                    size="compact"
                  />
                  
                  <p className="text-[13px] text-gray-400 mt-0.5">{description}</p>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      
      {/* Bottom spacer */}
      <div className="h-8" aria-hidden="true" />
    </motion.div>
  );
}
