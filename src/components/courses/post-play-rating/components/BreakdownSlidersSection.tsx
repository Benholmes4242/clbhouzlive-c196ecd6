import React from 'react';
import { Slider } from '@/components/ui/slider';
import { getScoreTier, isGoldTier } from '@/utils/getScoreTier';
import { BREAKDOWN_CATEGORIES, RATING_SLIDER_CONFIG, ANIMATION_TIMINGS } from '../constants';

interface BreakdownSlidersSectionProps {
  isEditMode: boolean;
  scores: {
    design: number | null;
    condition: number | null;
    clubhouse: number | null;
    facilities: number | null;
  };
  outstandingEntry: Record<string, boolean>;
  onScoreChange: (key: 'design' | 'condition' | 'clubhouse' | 'facilities', value: number) => void;
  onTouchChange: (key: 'design' | 'condition' | 'clubhouse' | 'facilities', touched: boolean) => void;
  onOutstandingEntry: (entry: Record<string, boolean>) => void;
  prevBreakdownTiersRef: React.MutableRefObject<Record<string, string>>;
  disabled?: boolean;
}

const BreakdownSlidersSection = React.memo(function BreakdownSlidersSection({
  isEditMode,
  scores,
  outstandingEntry,
  onScoreChange,
  onTouchChange,
  onOutstandingEntry,
  prevBreakdownTiersRef,
  disabled = false,
}: BreakdownSlidersSectionProps) {
  const handleSliderChange = (key: 'design' | 'condition' | 'clubhouse' | 'facilities', values: number[]) => {
    const newValue = values[0];
    const newTier = getScoreTier(newValue).tier;
    const oldTier = prevBreakdownTiersRef.current[key] as ScoreTier | undefined;
    
    // Detect crossing into the gold tier (Outstanding OR Exceptional) from below.
    if (isGoldTier(newTier) && !isGoldTier(oldTier)) {
      onOutstandingEntry({ ...outstandingEntry, [key]: true });
      setTimeout(() => {
        onOutstandingEntry({ ...outstandingEntry, [key]: false });
      }, ANIMATION_TIMINGS.outstandingGlow);
    }
    
    prevBreakdownTiersRef.current[key] = newTier;
    onTouchChange(key, true);
    onScoreChange(key, newValue);
  };

  return (
    <section className="px-6 pt-6 pb-3 bg-slate-50">
      <h3 className="text-lg font-semibold text-slate-900 mb-3">
        {isEditMode ? 'Edit your breakdown' : 'Submit your breakdown'}
      </h3>

      {BREAKDOWN_CATEGORIES.map(({ key, label }) => {
        const score = scores[key];
        
        return (
          <div key={key} className="mt-4">
            {/* Label row */}
            <div className="flex items-baseline justify-between">
              <span className="text-base font-semibold text-slate-900">{label}</span>
              <span 
                className="text-sm font-medium tabular-nums min-w-[3ch] text-right"
                style={{
                  ...(score != null && score >= 9 
                    ? { color: '#C1A84C' }
                    : { color: score != null ? '#334E3D' : '#94a3b8' }
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
                onValueChange={(values) => handleSliderChange(key, values)}
                min={RATING_SLIDER_CONFIG.min}
                max={RATING_SLIDER_CONFIG.max}
                step={RATING_SLIDER_CONFIG.step}
                disabled={disabled}
                className="w-full rating-slider-breakdown"
                data-tier={score != null && isGoldTier(getScoreTier(score).tier) ? 'outstanding' : undefined}
                data-just-entered={outstandingEntry[key] ? 'true' : undefined}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
});

export default BreakdownSlidersSection;
