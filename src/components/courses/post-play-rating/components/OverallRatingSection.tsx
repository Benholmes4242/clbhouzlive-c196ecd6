import React from 'react';
import { Slider } from '@/components/ui/slider';
import { getScoreTier, isGoldTier } from '@/utils/getScoreTier';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { RATING_SLIDER_CONFIG, ANIMATION_TIMINGS } from '../constants';

interface OverallRatingSectionProps {
  courseId: string;
  courseName: string;
  rating: number | null;
  isEditMode: boolean;
  isSubmitting: boolean;
  justEnteredOutstanding: boolean;
  onRatingChange: (value: number) => void;
  onOutstandingEntered: () => void;
  prevTierRef: React.MutableRefObject<string | null>;
}

const OverallRatingSection = React.memo(function OverallRatingSection({
  courseId,
  courseName,
  rating,
  isEditMode,
  isSubmitting,
  justEnteredOutstanding,
  onRatingChange,
  onOutstandingEntered,
  prevTierRef,
}: OverallRatingSectionProps) {
  const handleValueChange = (values: number[]) => {
    const newValue = values[0];
    const newTier = getScoreTier(newValue).tier;
    const oldTier = prevTierRef.current as ScoreTier | null;
    
    // Detect crossing into the gold tier (Outstanding OR Exceptional) from below.
    // Within-gold-zone slides (e.g. 9.2 → 9.7) and downward transitions do not fire.
    if (isGoldTier(newTier) && !isGoldTier(oldTier ?? undefined)) {
      onOutstandingEntered();
      setTimeout(() => onOutstandingEntered(), ANIMATION_TIMINGS.outstandingGlow);
    }
    
    prevTierRef.current = newTier;
    onRatingChange(newValue);
    analyticsEvents.ratings.sliderChanged({
      courseId,
      courseName,
      category: "overall",
      value: newValue,
    });
  };

  return (
    <section className="px-6 pt-6 pb-3 bg-slate-50">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-lg font-semibold text-slate-900">
          {isEditMode ? 'Edit your overall rating' : 'Submit your overall rating'}
        </span>
        <span 
          className={`text-base font-semibold tabular-nums transition-opacity duration-200 ${
            rating != null ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            ...(rating != null && rating >= 9 
              ? { color: '#C1A84C' }
              : { color: '#334E3D' }
            ),
          }}
        >
          {rating != null ? rating.toFixed(1) : ''}
        </span>
      </div>

      <div className="mt-3">
        <Slider
          value={[rating || 5]}
          onValueChange={handleValueChange}
          min={RATING_SLIDER_CONFIG.min}
          max={RATING_SLIDER_CONFIG.max}
          step={RATING_SLIDER_CONFIG.step}
          disabled={isSubmitting}
          className="w-full rating-slider-primary"
          data-tier={isGoldTier(getScoreTier(rating ?? 0.5).tier) ? 'outstanding' : undefined}
          data-just-entered={justEnteredOutstanding ? 'true' : undefined}
        />
      </div>

      {/* Rating label */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <span className="text-[11px] text-slate-500 tracking-[0.04em] uppercase font-medium">
          Your rating summary
        </span>
        <span 
          className="text-lg font-semibold uppercase tracking-wide"
          style={{
            ...(rating != null && rating >= 9 
              ? { color: '#C1A84C' }
              : { color: '#334E3D' }
            ),
          }}
        >
          {getScoreTier(rating ?? 0).label}
        </span>
      </div>
    </section>
  );
});

export default OverallRatingSection;
