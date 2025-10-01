import React from 'react';
import { format, isToday, isYesterday, isSameYear } from 'date-fns';

interface DaySeparatorProps {
  date: Date;
}

export const DaySeparator: React.FC<DaySeparatorProps> = ({ date }) => {
  const getDateLabel = (date: Date): string => {
    if (isToday(date)) {
      return 'Today';
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    if (isSameYear(date, new Date())) {
      return format(date, 'MMM d');
    }
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="relative my-3 sm:my-4">
      <div className="h-px bg-black/10" />
      <div className="absolute inset-x-0 -top-3 flex justify-center">
        <div className="px-3 py-1 text-[12px] font-medium rounded-full bg-white/85 backdrop-blur border border-black/10 text-gray-700 shadow-sm">
          {getDateLabel(date)}
        </div>
      </div>
    </div>
  );
};
