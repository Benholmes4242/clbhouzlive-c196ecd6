import React from 'react';
import { DateBucket, getDateBucketLabel } from '@/utils/dateSeparators';

interface DateSeparatorProps {
  bucket: DateBucket;
}

/**
 * DateSeparator - Subtle date divider in the feed
 * Shows: Today, Yesterday, Earlier this week, Last week, Older
 */
export const DateSeparator: React.FC<DateSeparatorProps> = ({ bucket }) => {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {getDateBucketLabel(bucket)}
      </p>
    </div>
  );
};

export default DateSeparator;
