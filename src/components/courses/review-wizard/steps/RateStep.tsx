/**
 * Step 1: Rate Your Experience
 * Uses 0-10 scale sliders with 0.1 precision (matching PostPlayRatingModal)
 */

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
  { key: 'design' as const, label: 'Course Design', description: 'Layout, variety, and shot values' },
  { key: 'condition' as const, label: 'Course Condition', description: 'Greens, fairways, and overall upkeep' },
  { key: 'clubhouse' as const, label: 'Clubhouse & Service', description: 'Facilities and staff friendliness' },
  { key: 'facilities' as const, label: 'Practice Facilities', description: 'Range, putting green, and amenities' },
];

export function RateStep({ 
  rating, 
  breakdowns, 
  onRatingChange, 
  onBreakdownChange 
}: RateStepProps) {
  // Track if breakdown sliders have been touched
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  
  // Track Outstanding tier entry for glow animation
  const [justEnteredOutstanding, setJustEnteredOutstanding] = useState(false);
  const prevTierRef = useRef<string | null>(null);
  
  // Track Outstanding entry for breakdown sliders
  const [breakdownOutstandingEntry, setBreakdownOutstandingEntry] = useState<Record<string, boolean>>({});
  const prevBreakdownTiersRef = useRef<Record<string, string>>({});
  
  const handleOverallRatingChange = (values: number[]) => {
    const newValue = values[0];
    const newTier = getScoreTier(newValue).tier;
    const oldTier = prevTierRef.current;
    
    // Detect crossing into Outstanding
    if (newTier === 'outstanding' && oldTier !== 'outstanding') {
      setJustEnteredOutstanding(true);
      setTimeout(() => setJustEnteredOutstanding(false), 600);
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
  const isOutstanding = rating !== null && rating >= 9;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6 p-4"
    >
      {/* Overall Rating */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            How would you rate this course?
          </h2>
          <span 
            className={`text-base font-semibold tabular-nums transition-opacity duration-200 ${
              rating != null ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              ...(isOutstanding
                ? { 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }
                : { color: '#64748b' }
              ),
            }}
          >
            {rating != null ? rating.toFixed(1) : ''}
          </span>
        </div>
        
        <div className="mt-2">
          <Slider
            value={[rating ?? 5]}
            onValueChange={handleOverallRatingChange}
            min={0}
            max={10}
            step={0.1}
            className="w-full rating-slider-primary"
            data-tier={tierData.tier === 'outstanding' ? 'outstanding' : undefined}
            data-just-entered={justEnteredOutstanding ? 'true' : undefined}
          />
        </div>
        
        {/* Rating label */}
        <div className="mt-2 flex flex-col items-center gap-1">
          <span className="text-[11px] text-muted-foreground tracking-[0.04em] uppercase font-medium">
            Your rating summary
          </span>
          <span 
            className="text-lg font-semibold uppercase tracking-wide"
            style={{
              ...(isOutstanding
                ? { 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }
                : { color: '#64748b' }
              ),
            }}
          >
            {tierData.label}
          </span>
        </div>
      </div>

      {/* Breakdown Sliders */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Rate the details (optional)
        </h3>
        
        {BREAKDOWN_FIELDS.map(({ key, label, description }) => {
          const score = breakdowns[key];
          const isTouched = touchedFields[key];
          const scoreIsOutstanding = score !== null && score >= 9;
          
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <span 
                  className="text-sm font-medium tabular-nums min-w-[3ch] text-right"
                  style={{
                    ...(scoreIsOutstanding
                      ? { 
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }
                      : { color: isTouched ? '#64748b' : '#94a3b8' }
                    ),
                  }}
                >
                  {isTouched && score != null ? score.toFixed(1) : '--'}
                </span>
              </div>
              <Slider
                value={[score ?? 5]}
                onValueChange={(values) => handleBreakdownChange(key, values)}
                min={0}
                max={10}
                step={0.1}
                className="w-full rating-slider-breakdown"
                data-tier={score != null && getScoreTier(score).tier === 'outstanding' ? 'outstanding' : undefined}
                data-just-entered={breakdownOutstandingEntry[key] ? 'true' : undefined}
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
