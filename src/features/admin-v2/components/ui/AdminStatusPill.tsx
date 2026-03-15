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

const VARIANT_STYLES: Record<StatusVariant, { bg: string; text: string; border: string; label: string }> = {
  active:   { bg: '#F0FDF4', text: '#17C964', border: '#BBF7D0', label: 'Active' },
  verified: { bg: '#F0FDF4', text: '#17C964', border: '#BBF7D0', label: 'Verified' },
  pending:  { bg: '#FFF7ED', text: '#F5A623', border: '#FED7AA', label: 'Pending' },
  full:     { bg: '#FFF7ED', text: '#F5A623', border: '#FED7AA', label: 'Full Admin' },
  error:    { bg: '#FFF1F2', text: '#F31260', border: '#FECDD3', label: 'Error' },
  banned:   { bg: '#FFF1F2', text: '#F31260', border: '#FECDD3', label: 'Banned' },
  inactive: { bg: '#F8FAFC', text: '#94A3B8', border: '#E2E8F0', label: 'Inactive' },
  limited:  { bg: '#EFF6FF', text: '#1D6FF5', border: '#BFDBFE', label: 'Limited' },
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
  showDot = false,
  className,
}: AdminStatusPillProps) {
  const styles = VARIANT_STYLES[status] ?? VARIANT_STYLES.inactive;
  const displayLabel = label ?? styles.label;

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      style={{
        background: styles.bg,
        color: styles.text,
        border: `1px solid ${styles.border}`,
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 8px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}
    >
      {showDot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: styles.text }} />
      )}
      {displayLabel}
    </span>
  );
}
