import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { formatRelativeAgoLong } from '@/i18n/format';

interface LastUpdatedPillProps {
  timestamp: string | null;
  className?: string;
}

export function LastUpdatedPill({ timestamp, className }: LastUpdatedPillProps) {
  const { t } = useTranslation('tourhub');
  if (!timestamp) return null;

  // formatRelativeAgoLong preserves the previous shape exactly:
  //   "less than a minute" → "just now"
  //   else                 → date-fns' "{distance} ago" (e.g. "about 1 hour ago")
  const display = formatRelativeAgoLong(timestamp);

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-[10px]",
      "bg-white/20 border border-white/25 text-white/90",
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
      {t('pill.updated', { time: display })}
    </span>
  );
}
