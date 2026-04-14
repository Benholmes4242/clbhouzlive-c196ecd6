import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({ children, className, noPadding }: Props) {
  return (
    <div
      className={cn('rounded-2xl', !noPadding && 'p-4', className)}
      style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
    >
      {children}
    </div>
  );
}