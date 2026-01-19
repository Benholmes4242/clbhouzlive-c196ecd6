/**
 * Step 1: Rate Your Experience
 * Matches PostPlayRatingModal slider styling with 0-10 scale
 */

import React, { useState, useRef } from 'react';
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
  { key: 'design' as const, label: 'Course Design' },
  { key: 'condition' as const, label: 'Course Condition' },
  { key: 'clubhouse' as const, label: 'Clubhouse' },
  { key: 'facilities' as const, label: 'Facilities' },
];

export function RateStep({ 
  rating, 
  breakdowns, 
  onRatingChange, 
  onBreakdownChange 
}: RateStepProps) {
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
    
    // Detect crossing into Outstanding for this breakdown
    if (newTier === 'outstanding' && oldTier !== 'outstanding') {
      setBreakdownOutstandingEntry(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setBreakdownOutstandingEntry(prev => ({ ...prev, [key]: false }));
      }, 600);
    }
    
    prevBreakdownTiersRef.current[key] = newTier;
    onBreakdownChange(key, newValue);
  };

  const currentTier = getScoreTier(rating ?? 0.5);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col"
    >
      {/* Overall Rating Slider - matches PostPlayRatingModal Section A */}
      <section className="px-6 pt-6 pb-4 bg-slate-50">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-lg font-semibold text-slate-900">
            Your overall rating
          </span>
          <span 
            className={`text-base font-semibold tabular-nums transition-opacity duration-200 ${
              rating != null ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              ...(rating != null && rating >= 9 
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

        <div className="mt-3">
          <Slider
            value={[rating ?? 5]}
            onValueChange={handleOverallRatingChange}
            min={0.5}
            max={10}
            step={0.1}
            className="w-full rating-slider-primary"
            data-tier={currentTier.tier === 'outstanding' ? 'outstanding' : undefined}
            data-just-entered={justEnteredOutstanding ? 'true' : undefined}
          />
        </div>

        {/* Rating label - uses tier text with gradient styling */}
        <div className="mt-4 flex flex-col items-center gap-1.5">
          <span className="text-[11px] text-slate-500 tracking-[0.04em] uppercase font-medium">
            Your rating summary
          </span>
          <span 
            className="text-lg font-semibold uppercase tracking-wide"
            style={{
              ...(rating != null && rating >= 9 
                ? { 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }
                : { color: '#64748b' }
              ),
            }}
          >
            {currentTier.label}
          </span>
        </div>
      </section>

      {/* Breakdown Sliders - matches PostPlayRatingModal Section C */}
      <section className="px-6 pt-6 pb-4 bg-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          Your breakdown <span className="text-sm font-normal text-slate-500">(optional)</span>
        </h3>

        {BREAKDOWN_FIELDS.map(({ key, label }) => {
          const score = breakdowns[key];
          const breakdownTier = getScoreTier(score ?? 0.5);
          
          return (
            <div key={key} className="mt-4">
              {/* Label row - aligned with consistent right edge for values */}
              <div className="flex items-baseline justify-between">
                <span className="text-base font-semibold text-slate-900">{label}</span>
                <span 
                  className={`text-sm font-medium tabular-nums min-w-[3ch] text-right`}
                  style={{
                    ...(score != null && score >= 9 
                      ? { 
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }
                      : { color: score != null ? '#64748b' : '#94a3b8' }
                    ),
                  }}
                >
                  {score != null ? score.toFixed(1) : '--'}
                </span>
              </div>

              {/* Slider */}
              <div className="mt-2 mb-3">
                <Slider
                  value={[score ?? 5]}
                  onValueChange={(values) => handleBreakdownChange(key, values)}
                  min={0.5}
                  max={10}
                  step={0.1}
                  className="w-full rating-slider-breakdown"
                  data-tier={breakdownTier.tier === 'outstanding' ? 'outstanding' : undefined}
                  data-just-entered={breakdownOutstandingEntry[key] ? 'true' : undefined}
                />
              </div>
            </div>
          );
        })}
      </section>
    </motion.div>
  );
}
