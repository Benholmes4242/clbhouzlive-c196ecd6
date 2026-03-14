import React from 'react';
import { cn } from '@/lib/utils';

type StatusVariant =
  | 'active'
  | 'pending'
  | 'error'
  | 'inactive'
  | 'verified'
  | 'banned'
  | 'full'
  | 'limited';

const VARIANT_STYLES: Record<StatusVariant, { bg: string; text: string; dot: string; label: string }> = {
  active:   { bg: 'bg-green-50 dark:bg-green-500/15',   text: 'text-green-700 dark:text-green-400',   dot: 'bg-green-500',  label: 'Active' },
  pending:  { bg: 'bg-yellow-50 dark:bg-yellow-500/15', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500', label: 'Pending' },
  error:    { bg: 'bg-red-50 dark:bg-red-500/15',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500',    label: 'Error' },
  banned:   { bg: 'bg-red-50 dark:bg-red-500/15',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500',    label: 'Banned' },
  inactive: { bg: 'bg-muted',                           text: 'text-muted-foreground',                dot: 'bg-muted-foreground/40', label: 'Inactive' },
  verified: { bg: 'bg-blue-50 dark:bg-blue-500/15',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500',   label: 'Verified' },
  full:     { bg: 'bg-amber-50 dark:bg-amber-500/15',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500',  label: 'Full Admin' },
  limited:  { bg: 'bg-muted',                           text: 'text-muted-foreground',                dot: 'bg-muted-foreground/40', label: 'Limited' },
};

interface AdminStatusPillProps {
  status: StatusVariant;
  label?: string;
  showDot?: boolean;
  className?: string;
}

export function AdminStatusPill({
  status,
  label,
  showDot = true,
  className,
}: AdminStatusPillProps) {
  const styles = VARIANT_STYLES[status] ?? VARIANT_STYLES.inactive;
  const displayLabel = label ?? styles.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold',
        styles.bg,
        styles.text,
        className,
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', styles.dot)} />
      )}
      {displayLabel}
    </span>
  );
}
