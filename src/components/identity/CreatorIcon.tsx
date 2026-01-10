import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatorIconProps {
  className?: string;
}

export function CreatorIcon({ className }: CreatorIconProps) {
  return <Sparkles className={cn("h-3 w-3 text-muted-foreground", className)} />;
}
