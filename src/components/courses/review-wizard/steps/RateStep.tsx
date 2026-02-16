/**
 * Step 1: Rate Your Experience
 * Uses 0-10 scale sliders with 0.1 precision
 * Amber-themed with card-wrapped breakdowns, stagger entrance
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
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

const TICK_MARKS = [0, 2, 4, 6, 8, 10];

export function RateStep({ 
  rating, 
  breakdowns, 
  onRatingChange, 
  onBreakdownChange 
}: RateStepProps) {
  // Track if overall rating has been touched (init from existing rating in edit mode)
  const [overallTouched, setOverallTouched] = useState(() => rating !== null);
  
  // Track if breakdown sliders have been touched
  // Initialize based on existing breakdown values (edit mode)
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
  
  // Sync overallTouched with rating for edit mode async load
  useEffect(() => {
    if (rating !== null && !overallTouched) {
      setOverallTouched(true);
    }
  }, [rating]);
  
  // Track Outstanding tier entry for glow animation
  const [justEnteredOutstanding, setJustEnteredOutstanding] = useState(false);
  const prevTierRef = useRef<string | null>(null);
  
  // Track tier changes for label pulse animation
  const [tierPulse, setTierPulse] = useState(false);
  
  // Track Outstanding entry for breakdown sliders
  const [breakdownOutstandingEntry, setBreakdownOutstandingEntry] = useState<Record<string, boolean>>({});
  const prevBreakdownTiersRef = useRef<Record<string, string>>({});
  
  const handleOverallRatingChange = (values: number[]) => {
    const newValue = values[0];
    const newTier = getScoreTier(newValue).tier;
    const oldTier = prevTierRef.current;
    
    // Mark as touched on first interaction
    if (!overallTouched) {
      setOverallTouched(true);
    }
    
    // Detect crossing into Outstanding
    if (newTier === 'outstanding' && oldTier !== 'outstanding') {
      setJustEnteredOutstanding(true);
      setTimeout(() => setJustEnteredOutstanding(false), 600);
    }
    
    // Detect any tier boundary crossing for label pulse
    if (oldTier && newTier !== oldTier) {
      setTierPulse(true);
      setTimeout(() => setTierPulse(false), 300);
    }
    
    prevTierRef.current = newTier;
    onRatingChange(newValue);
  };
  
  const handleBreakdownChange = (key: keyof ReviewBreakdowns, values: number[]) => {
    const newValue = values[0];
    const newTier = getScoreTier(newValue).tier;
    const oldTier = prevBreakdownTiersRef.current[key];
    
    // Detect crossing into Outstanding
    if (newTier === 'outstanding' && oldTier !== 'outstanding') {
      setBreakdownOutstandingEntry(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setBreakdownOutstandingEntry(prev => ({ ...prev, [key]: false }));
      }, 600);
    }
    
    prevBreakdownTiersRef.current[key] = newTier;
    setTouchedFields(prev => ({ ...prev, [key]: true }));
    onBreakdownChange(key, newValue);
  };

  const tierData = getScoreTier(rating ?? 0);
  const isOutstanding = overallTouched && rating !== null && rating >= 9;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="shrink-0 px-4 pt-6"
      style={{ background: 'linear-gradient(to bottom, rgba(254,243,199,0.4), white 85%)' }}
    >
      {/* Main Rating Section */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            Your verdict on this course?
          </h2>
          <span 
            className={`text-2xl font-bold tabular-nums transition-all duration-200 ${
              overallTouched && rating != null ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              ...(isOutstanding
                ? { color: '#f59e0b', textShadow: '0 1px 8px rgba(245, 158, 11, 0.25)' }
                : { color: '#374151' }
              ),
            }}
          >
            {overallTouched && rating != null ? rating.toFixed(1) : ''}
          </span>
        </div>
        
        <Slider
          value={[rating ?? 5]}
          onValueChange={handleOverallRatingChange}
          min={0}
          max={10}
          step={0.1}
          className="w-full rating-slider-primary wizard-slider"
          data-tier={overallTouched && tierData.tier === 'outstanding' ? 'outstanding' : undefined}
          data-just-entered={justEnteredOutstanding ? 'true' : undefined}
          data-untouched={!overallTouched ? 'true' : undefined}
        />
        
        {/* Tick marks for scale reference */}
        <div className="relative w-full mt-1.5 h-5" aria-hidden="true">
          {TICK_MARKS.map(tick => (
            <div
              key={tick}
              className="absolute flex flex-col items-center"
              style={{ left: `${(tick / 10) * 100}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-px h-2 bg-border/50" />
              <span className="text-[9px] text-gray-400 tabular-nums mt-0.5">
                {tick}
              </span>
            </div>
          ))}
        </div>
        
        {/* Rating label - shows "–" until first touch, then tier label with pulse */}
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-500 tracking-wide uppercase font-medium">
            Rating:
          </span>
          <AnimatePresence mode="wait">
            {overallTouched ? (
              <motion.span
                key={tierData.tier}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: tierPulse ? 1.05 : 1,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="text-sm uppercase tracking-wider"
                style={{
                  ...(isOutstanding
                    ? { color: '#f59e0b', fontWeight: 600 }
                    : { color: '#6b7280', fontWeight: 500 }
                  ),
                }}
              >
                {tierData.label}
              </motion.span>
            ) : (
              <motion.span
                key="unrated"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-semibold text-gray-300"
              >
                –
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Detail Ratings — wrapped in card */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Rate each area
        </h3>
        
        <div className="space-y-6">
          {BREAKDOWN_FIELDS.map(({ key, label, description }, index) => {
            const score = breakdowns[key];
            const isTouched = touchedFields[key];
            const scoreIsOutstanding = isTouched && score !== null && score >= 9;
            
            return (
              <motion.div 
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.25 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-800">{label}</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isTouched && score != null ? score.toFixed(1) : 'empty'}
                      initial={isTouched ? { opacity: 0, scale: 0.9 } : false}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium tabular-nums min-w-[3ch] text-right"
                      style={{
                        ...(scoreIsOutstanding
                          ? { color: '#f59e0b' }
                          : { color: isTouched ? '#6b7280' : 'rgba(107, 114, 128, 0.7)' }
                        ),
                      }}
                    >
                      {isTouched && score != null ? score.toFixed(1) : '–'}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <Slider
                  value={[score ?? 5]}
                  onValueChange={(values) => handleBreakdownChange(key, values)}
                  min={0}
                  max={10}
                  step={0.1}
                  className="w-full rating-slider-breakdown wizard-slider wizard-slider-compact"
                  data-tier={isTouched && score != null && getScoreTier(score).tier === 'outstanding' ? 'outstanding' : undefined}
                  data-just-entered={breakdownOutstandingEntry[key] ? 'true' : undefined}
                  data-untouched={!isTouched ? 'true' : undefined}
                />
                {/* Endpoint labels */}
                <div className="flex justify-between mt-1" aria-hidden="true">
                  <span className="text-[9px] text-gray-400 tabular-nums">0</span>
                  <span className="text-[9px] text-gray-400 tabular-nums">10</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Bottom spacer for scroll room */}
      <div className="h-8" aria-hidden="true" />
    </motion.div>
  );
}
