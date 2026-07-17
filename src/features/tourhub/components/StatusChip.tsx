import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface StatusChipProps {
  status: 'live' | 'upcoming' | 'complete';
  className?: string;
}

// NOTE (i18n audit — Wave 3e.i): comparisons in this component are on the
// `status` PROP enum ('live' | 'upcoming' | 'complete'), NEVER on the rendered
// display label. Keying the display strings is safe.
export function StatusChip({ status, className }: StatusChipProps) {
  const { t } = useTranslation('tourhub');
  const label =
    status === 'live'
      ? t('status.live')
      : status === 'upcoming'
        ? t('status.upcoming')
        : t('status.final');
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide",
      status === 'live' && "bg-[var(--th-accent-live)] text-white",
      status === 'upcoming' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      status === 'complete' && "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
      className
    )}>
      {status === 'live' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
      {label}
    </span>
  );
}
