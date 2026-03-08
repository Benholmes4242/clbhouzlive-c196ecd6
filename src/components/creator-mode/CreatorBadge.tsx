import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatorBadgeProps {
  className?: string;
}

export function CreatorBadge({ className }: CreatorBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold',
        className,
      )}
    >
      <Sparkles className="h-2.5 w-2.5" />
      Creator
    </span>
  );
}
