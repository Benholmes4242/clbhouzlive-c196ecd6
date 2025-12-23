import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthPrimaryButton } from '@/components/auth-v2';
import type { OnboardingData } from '@/pages/OnboardingV2';

interface OnboardingHandicapProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  saveProgress: (updates: Partial<OnboardingData>) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

const MIN_HANDICAP = 0;
const MAX_HANDICAP = 54;
const STEP = 0.1;

/**
 * B4 - Handicap Index Step
 * Large numeric input with stepper controls
 */
const OnboardingHandicap: React.FC<OnboardingHandicapProps> = ({
  data,
  updateData,
  saveProgress,
  onNext,
}) => {
  const handicap = data.handicapIndex ?? 18.0;

  const setHandicap = (value: number) => {
    const clamped = Math.max(MIN_HANDICAP, Math.min(MAX_HANDICAP, value));
    const rounded = Math.round(clamped * 10) / 10;
    updateData({ handicapIndex: rounded });
  };

  const increment = () => setHandicap(handicap + STEP);
  const decrement = () => setHandicap(handicap - STEP);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setHandicap(value);
    }
  };

  const handleNext = async () => {
    await saveProgress({ handicapIndex: data.handicapIndex });
    onNext();
  };

  // Quick preset buttons
  const presets = [
    { label: 'Beginner', value: 36 },
    { label: 'Mid', value: 18 },
    { label: 'Low', value: 9 },
    { label: 'Scratch', value: 0 },
  ];

  return (
    <div className="flex-1 flex flex-col px-6 pt-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Handicap index
        </h1>
        <p className="text-white/50">
          You can change this anytime. New to golf? Try 54.0
        </p>
      </div>

      {/* Main Input */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex items-center gap-6">
          {/* Decrement */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={decrement}
            disabled={handicap <= MIN_HANDICAP}
            className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus className="w-6 h-6" />
          </motion.button>

          {/* Value */}
          <div className="text-center">
            <input
              type="number"
              value={handicap.toFixed(1)}
              onChange={handleInputChange}
              step={STEP}
              min={MIN_HANDICAP}
              max={MAX_HANDICAP}
              className="w-32 text-6xl font-bold text-white text-center bg-transparent border-none outline-none"
            />
          </div>

          {/* Increment */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={increment}
            disabled={handicap >= MAX_HANDICAP}
            className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Range indicator */}
        <p className="text-white/40 text-sm mt-4">
          {MIN_HANDICAP} – {MAX_HANDICAP}
        </p>

        {/* Presets */}
        <div className="flex gap-2 mt-8">
          {presets.map((preset) => (
            <motion.button
              key={preset.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => setHandicap(preset.value)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                Math.abs(handicap - preset.value) < 0.5
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              {preset.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="py-6">
        <AuthPrimaryButton onClick={handleNext}>
          Next
        </AuthPrimaryButton>
      </div>
    </div>
  );
};

export default OnboardingHandicap;
