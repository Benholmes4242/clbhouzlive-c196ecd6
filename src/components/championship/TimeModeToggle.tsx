import React from 'react';
import { PillToggle } from '@/components/ui/PillToggle';

interface TimeModeToggleProps {
  value: 'seasonal' | 'all_time';
  onChange: (value: 'seasonal' | 'all_time') => void;
}

const timeFrameOptions = [
  { id: 'seasonal', label: 'This Season' },
  { id: 'all_time', label: 'All-Time' },
];

/**
 * TimeModeToggle - This Season / All-Time pill toggle
 * 
 * Features:
 * - Apple-style pill toggle
 * - Centered placement
 * - Smooth transitions
 */
export const TimeModeToggle: React.FC<TimeModeToggleProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex justify-center py-2">
      <PillToggle 
        options={timeFrameOptions} 
        selected={value} 
        onSelect={(id) => onChange(id as 'seasonal' | 'all_time')}
      />
    </div>
  );
};

export default TimeModeToggle;
