/**
 * Step 1: Rate Your Experience
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { ReviewBreakdowns } from '../types';

interface RateStepProps {
  rating: number | null;
  breakdowns: ReviewBreakdowns;
  onRatingChange: (rating: number) => void;
  onBreakdownChange: (key: keyof ReviewBreakdowns, value: number | null) => void;
}

const STAR_LABELS = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

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
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-8 p-4"
    >
      {/* Overall Rating */}
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          How would you rate this course?
        </h2>
        
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(star)}
              className="p-1 transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={cn(
                  "h-10 w-10 transition-colors",
                  rating && star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
        
        {rating && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-primary"
          >
            {STAR_LABELS[rating - 1]}
          </motion.p>
        )}
      </div>

      {/* Breakdown Sliders */}
      <div className="space-y-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Rate the details (optional)
        </h3>
        
        {BREAKDOWN_FIELDS.map(({ key, label, description }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-foreground">{label}</span>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              {breakdowns[key] !== null && (
                <span className="text-sm font-semibold text-primary">
                  {breakdowns[key]}/5
                </span>
              )}
            </div>
            <Slider
              value={breakdowns[key] !== null ? [breakdowns[key]!] : [0]}
              onValueChange={([value]) => onBreakdownChange(key, value || null)}
              max={5}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
