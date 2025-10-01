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
    <div className="my-3 grid place-items-center">
      <div className="rounded-full px-3 py-1 text-[12px] font-medium bg-black/[0.05] text-gray-600">
        {getDateLabel(date)}
      </div>
    </div>
  );
};
