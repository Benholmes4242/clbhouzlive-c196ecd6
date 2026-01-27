/**
 * Step 1: Rate Your Experience
 * Uses 0-10 scale sliders with 0.1 precision (matching PostPlayRatingModal)
 * Semantic tokens for typography
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
  { key: 'design' as const, label: 'Course Design', description: 'Layout, design and landscape' },
  { key: 'condition' as const, label: 'Course Condition', description: 'Greens, fairways, and overall upkeep' },
  { key: 'clubhouse' as const, label: 'Clubhouse & Service', description: 'Clubhouse, changing rooms and staff friendliness' },
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
      className="shrink-0 px-4 pt-10"
    >
      {/* Main Rating Section - grouped together */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg font-semibold text-foreground">
            Your verdict on this course?
          </h2>
          <span 
            className={`text-2xl font-bold tabular-nums transition-opacity duration-200 ${
              rating != null ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              ...(isOutstanding
                ? { color: '#f59e0b' }
                : { color: '#6b7280' }
              ),
            }}
          >
            {rating != null ? rating.toFixed(1) : ''}
          </span>
        </div>
        
        <Slider
          value={[rating ?? 5]}
          onValueChange={handleOverallRatingChange}
          min={0}
          max={10}
          step={0.1}
          className="w-full rating-slider-primary wizard-slider"
          data-tier={tierData.tier === 'outstanding' ? 'outstanding' : undefined}
          data-just-entered={justEnteredOutstanding ? 'true' : undefined}
        />
        
        {/* Rating label - compact */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground tracking-wide uppercase font-medium">
            Rating:
          </span>
          <span
            className="text-sm font-semibold uppercase tracking-wide"
            style={{
              ...(isOutstanding
                ? { color: '#f59e0b' }
                : { color: '#6b7280' }
              ),
            }}
          >
            {tierData.label}
          </span>
        </div>
      </div>

      {/* Detail Ratings - grouped with consistent gaps */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Share detailed ratings
        </h3>
        
        {/* Natural spacing between rows - NOT justify-between */}
        <div className="space-y-6">
          {BREAKDOWN_FIELDS.map(({ key, label, description }) => {
            const score = breakdowns[key];
            const isTouched = touchedFields[key];
            const scoreIsOutstanding = score !== null && score >= 9;
            
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span 
                    className="text-sm font-medium tabular-nums min-w-[3ch] text-right"
                    style={{
                      ...(scoreIsOutstanding
                        ? { color: '#f59e0b' }
                        : { color: isTouched ? '#6b7280' : 'rgba(107, 114, 128, 0.7)' }
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
                  className="w-full rating-slider-breakdown wizard-slider wizard-slider-compact"
                  data-tier={score != null && getScoreTier(score).tier === 'outstanding' ? 'outstanding' : undefined}
                  data-just-entered={breakdownOutstandingEntry[key] ? 'true' : undefined}
                />
                {/* Tooltip description */}
                <p className="text-xs text-muted-foreground/70 mt-1.5">{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
