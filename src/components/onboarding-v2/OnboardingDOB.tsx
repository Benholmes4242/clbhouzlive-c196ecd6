import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthPrimaryButton } from '@/components/auth-v2';
import type { OnboardingData } from '@/pages/OnboardingV2';

interface OnboardingDOBProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  saveProgress: (updates: Partial<OnboardingData>) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const minYear = currentYear - 100;
const maxYear = currentYear - 13; // Minimum 13 years old

/**
 * B5 - Date of Birth Step
 * Clean date picker with scroll/button controls
 */
const OnboardingDOB: React.FC<OnboardingDOBProps> = ({
  data,
  updateData,
  saveProgress,
  onNext,
}) => {
  const dob = data.dateOfBirth ?? new Date(1990, 0, 1);
  
  const [day, setDay] = useState(dob.getDate());
  const [month, setMonth] = useState(dob.getMonth());
  const [year, setYear] = useState(dob.getFullYear());
  const [error, setError] = useState<string | null>(null);

  const getDaysInMonth = (m: number, y: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(month, year);

  const updateDOB = (d: number, m: number, y: number) => {
    const newDate = new Date(y, m, d);
    updateData({ dateOfBirth: newDate });
  };

  const adjustDay = (delta: number) => {
    let newDay = day + delta;
    if (newDay < 1) newDay = daysInMonth;
    if (newDay > daysInMonth) newDay = 1;
    setDay(newDay);
    updateDOB(newDay, month, year);
  };

  const adjustMonth = (delta: number) => {
    let newMonth = month + delta;
    if (newMonth < 0) newMonth = 11;
    if (newMonth > 11) newMonth = 0;
    setMonth(newMonth);
    // Adjust day if needed
    const maxDays = getDaysInMonth(newMonth, year);
    const newDay = Math.min(day, maxDays);
    setDay(newDay);
    updateDOB(newDay, newMonth, year);
  };

  const adjustYear = (delta: number) => {
    let newYear = year + delta;
    if (newYear < minYear) newYear = maxYear;
    if (newYear > maxYear) newYear = minYear;
    setYear(newYear);
    // Adjust day if needed (leap year Feb)
    const maxDays = getDaysInMonth(month, newYear);
    const newDay = Math.min(day, maxDays);
    setDay(newDay);
    updateDOB(newDay, month, newYear);
  };

  const handleNext = async () => {
    const age = currentYear - year;
    if (age < 13) {
      setError('You must be at least 13 years old.');
      return;
    }
    setError(null);
    await saveProgress({ dateOfBirth: new Date(year, month, day) });
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Date of birth
        </h1>
        <p className="text-white/50">
          This won't be shown on your profile.
        </p>
      </div>

      {/* Date Picker */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-4">
          {/* Day */}
          <DateColumn
            value={day.toString().padStart(2, '0')}
            onUp={() => adjustDay(1)}
            onDown={() => adjustDay(-1)}
          />

          {/* Month */}
          <DateColumn
            value={MONTHS[month]}
            onUp={() => adjustMonth(1)}
            onDown={() => adjustMonth(-1)}
            wide
          />

          {/* Year */}
          <DateColumn
            value={year.toString()}
            onUp={() => adjustYear(-1)}
            onDown={() => adjustYear(1)}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-center text-red-400 text-sm mb-4">{error}</p>
      )}

      {/* CTA */}
      <div className="py-6">
        <AuthPrimaryButton onClick={handleNext}>
          Next
        </AuthPrimaryButton>
      </div>
    </div>
  );
};

const DateColumn: React.FC<{
  value: string;
  onUp: () => void;
  onDown: () => void;
  wide?: boolean;
}> = ({ value, onUp, onDown, wide }) => (
  <div className="flex flex-col items-center">
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onUp}
      className="p-2 text-white/40 hover:text-white transition-colors"
    >
      <ChevronUp className="w-6 h-6" />
    </motion.button>
    
    <div 
      className={`py-3 px-4 bg-white/10 rounded-xl text-white font-semibold text-xl ${
        wide ? 'min-w-[120px]' : 'min-w-[60px]'
      } text-center`}
    >
      {value}
    </div>
    
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onDown}
      className="p-2 text-white/40 hover:text-white transition-colors"
    >
      <ChevronDown className="w-6 h-6" />
    </motion.button>
  </div>
);

export default OnboardingDOB;
