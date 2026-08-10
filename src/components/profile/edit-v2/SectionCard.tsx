import { cn } from '@/lib/utils';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * THE SHARED SHELL for both profile editors (personal and business).
 * Panel token values, never hardcoded - one vocabulary for one page shape.
 */
export function SectionCard({ children, className, noPadding }: Props) {
  return (
    <div
      className={cn('rounded-2xl', !noPadding && 'p-4', className)}
      style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
    >
      {children}
    </div>
  );
}
