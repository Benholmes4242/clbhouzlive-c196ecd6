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
  isLegacyMigration?: boolean;
  onRatingChange: (rating: number) => void;
  onBreakdownChange: (key: keyof ReviewBreakdowns, value: number | null) => void;
}

const BREAKDOWN_FIELDS = [
  { key: 'design' as const,     label: 'Course Design',       description: 'Layout, design and landscape' },
  { key: 'condition' as const,  label: 'Course Condition',    description: 'Greens, fairways and upkeep' },
  { key: 'clubhouse' as const,  label: 'Clubhouse',           description: 'Building, food and welcome' },
  { key: 'facilities' as const, label: 'Practice Facilities', description: 'Range, putting green and short-game area' },
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
  // D8: transient release-confirmation scale (1.0 → 1.15 → 1.0 over 200ms)
  const [isAnimatingThumb, setIsAnimatingThumb] = useState(false);
  // D4: layered haptics — light on 0.5 crossings, medium on integer crossings
  const lastHapticValueRef = useRef<number>(value);

  const trackHeight = size === 'hero' ? 8 : 6;
  const thumbSize = size === 'hero' ? 28 : 22;
  const thumbActiveSize = size === 'hero' ? 32 : 26;
  // D11: ensure compact slider wrapper meets Apple HIG 44px minimum hit area
  const wrapperPadding = 16;
  const wrapperMin = 44;
  const wrapperHeight = Math.max(thumbSize + wrapperPadding, wrapperMin);

  const handleHapticTick = useCallback((newValue: number) => {
    const prev = lastHapticValueRef.current;
    const isIntegerCrossing = Math.floor(newValue) !== Math.floor(prev);
    const isHalfCrossing = Math.floor(newValue * 2) !== Math.floor(prev * 2);
    if (isIntegerCrossing) {
      triggerHaptic('medium');
    } else if (isHalfCrossing) {
      triggerHaptic('light');
    }
    lastHapticValueRef.current = newValue;
  }, []);

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
    lastHapticValueRef.current = newValue;
    onChange(newValue);
  }, [touched, onFirstTouch, getValueFromPosition, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    const newValue = getValueFromPosition(e.clientX);
    handleHapticTick(newValue);
    onChange(newValue);
  }, [isDragging, getValueFromPosition, onChange, handleHapticTick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!touched) onFirstTouch();
      const newVal = Math.min(10, snapToTenth((value ?? 5) + 0.1));
      onChange(newVal);
      handleHapticTick(newVal);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!touched) onFirstTouch();
      const newVal = Math.max(0, snapToTenth((value ?? 5) - 0.1));
      onChange(newVal);
      handleHapticTick(newVal);
    }
  }, [value, touched, onFirstTouch, onChange, handleHapticTick]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    // D8: release confirmation pulse
    setIsAnimatingThumb(true);
    setTimeout(() => setIsAnimatingThumb(false), 200);
  }, []);

  const percent = (value / 10) * 100;
  const tierData = touched ? getScoreTier(value) : null;

  // D8: compute thumb scale — release pulse takes precedence over drag size
  const thumbScale = isAnimatingThumb ? 1.15 : 1.0;

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
      <div
        ref={trackRef}
        className="relative w-full cursor-pointer"
        style={{ height: wrapperHeight, paddingTop: (wrapperHeight - trackHeight) / 2, paddingBottom: (wrapperHeight - trackHeight) / 2 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
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
            transform: `translate(-50%, -50%) scale(${thumbScale})`,
            transition: isDragging
              ? 'transform 200ms ease'
              : 'transform 200ms ease, width 100ms ease, height 100ms ease, box-shadow 100ms ease, border-width 100ms ease',
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
  isLegacyMigration = false,
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

  // Note: overall verdict is derived from breakdowns (D28); no direct edit handler.
  void onRatingChange; // retained in props for API compatibility

  const handleBreakdownChange = useCallback((key: keyof ReviewBreakdowns, val: number) => {
    setTouchedFields(prev => ({ ...prev, [key]: true }));
    onBreakdownChange(key, val);
  }, [onBreakdownChange]);

  const locationText = course ? formatCourseLocation({
    sub_country: course.sub_country,
    region: course.region,
    country: course.country,
  }) : '';

  // D28: Display the derived verdict (mean of set categories) once any category
  // is touched, so the user sees the verdict update live as they rate.
  // Falls back to the prefilled overall rating when no categories are set yet.
  const setBreakdownValues = Object.values(breakdowns).filter((v): v is number => v !== null);
  const derivedVerdict = setBreakdownValues.length > 0
    ? parseFloat((setBreakdownValues.reduce((s, v) => s + v, 0) / setBreakdownValues.length).toFixed(1))
    : null;
  const displayVerdict = derivedVerdict ?? rating;

  const overallTier = displayVerdict !== null ? getScoreTier(displayVerdict) : null;

  // D30: Sticky verdict bar — engages when hero verdict block scrolls offscreen
  const heroRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    if (!heroRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      // WizardHeader: 48px row + max(safe-area, 47px) ≈ 95px on notched devices
      { threshold: 0, rootMargin: '-95px 0px 0px 0px' }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  // D7: pulse the verdict number (1.0 → 1.06 → 1.0 over 200ms) when
  // displayVerdict changes — fires in both hero and sticky bar.
  const [isAnimatingVerdict, setIsAnimatingVerdict] = useState(false);
  const prevVerdictRef = useRef<number | null>(displayVerdict);
  useEffect(() => {
    if (displayVerdict !== prevVerdictRef.current && displayVerdict !== null) {
      setIsAnimatingVerdict(true);
      const t = setTimeout(() => setIsAnimatingVerdict(false), 200);
      prevVerdictRef.current = displayVerdict;
      return () => clearTimeout(t);
    }
    prevVerdictRef.current = displayVerdict;
  }, [displayVerdict]);

  return (
    <>
      {/* D6: Keyframes for tier label fade-and-rise */}
      <style>{`
        @keyframes verdictLabelEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* D30: Sticky compact verdict bar — engages on scroll past hero */}
      <AnimatePresence>
        {showSticky && displayVerdict !== null && (
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-40 bg-slate-50/95 backdrop-blur-md border-b border-slate-200"
          >
            <div
              className="px-4 pb-2 flex items-center justify-between"
              style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px))' }}
            >
              <span className="text-[10px] font-extrabold tracking-widest text-amber-500">VERDICT</span>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-[22px] font-black tracking-tight text-slate-900 tabular-nums"
                  style={{
                    display: 'inline-block',
                    transform: isAnimatingVerdict ? 'scale(1.06)' : 'scale(1.0)',
                    transition: 'transform 200ms ease',
                  }}
                >
                  {displayVerdict.toFixed(1)}
                </span>
                {overallTier && (
                  <span
                    key={overallTier.label}
                    className="text-[11px] font-extrabold tracking-widest text-slate-500"
                    style={{
                      display: 'inline-block',
                      animation: 'verdictLabelEnter 200ms ease-out',
                    }}
                  >
                    {overallTier.label}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Overall Verdict — derived from category breakdowns (D28) */}
      <div ref={heroRef} style={{ padding: '24px 16px 16px' }}>
        {/* Dispatch eyebrow */}
        <div style={{ textAlign: 'center', fontSize: 8.5, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
          ⚡ Your Verdict
        </div>

        {/* Large animated score — derived from breakdowns */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <motion.span
            key={displayVerdict !== null ? displayVerdict.toFixed(1) : 'unset'}
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            style={{
              fontSize: 48,
              fontWeight: 900,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              color: displayVerdict !== null ? '#0F172A' : 'rgba(15,23,42,0.18)',
            }}
          >
            {displayVerdict !== null ? displayVerdict.toFixed(1) : '—'}
          </motion.span>
        </div>

        {/* Tier label */}
        {overallTier ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}
          >
            {overallTier.label}
          </motion.p>
        ) : (
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 8 }}>
            Rate categories below to set your verdict
          </p>
        )}

        {/* D28: Auto-calculated note */}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#CBD5E1', margin: 0 }}>
          Auto-calculated from your category ratings
        </p>

        {/* D33: Legacy migration notice */}
        {isLegacyMigration && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 12px',
              background: 'rgba(247,147,30,0.06)',
              border: '0.5px solid rgba(247,147,30,0.25)',
              borderRadius: 10,
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', lineHeight: 1.45, margin: 0 }}>
              We've updated how ratings work — please re-rate the categories below to update your verdict.
            </p>
          </div>
        )}
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
                      style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#0F172A', flexShrink: 0, marginLeft: 8 }}
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
    </>
  );
}