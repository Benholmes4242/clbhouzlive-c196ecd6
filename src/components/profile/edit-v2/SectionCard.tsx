import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({ children, className, noPadding }: Props) {
  return (
    <div
      className={cn(
        'bg-card rounded-2xl border border-border/60 shadow-sm',
        !noPadding && 'p-4',
        className
      )}
    >
      {children}
    </div>
  );
}
