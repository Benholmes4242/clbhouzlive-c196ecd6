import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadReceiptsProps {
  sent: boolean;
  delivered?: boolean;
  read?: boolean;
  className?: string;
}

export function ReadReceipts({ 
  sent, 
  delivered = false, 
  read = false,
  className,
}: ReadReceiptsProps) {
  if (!sent) return null;

  // Double blue check for read
  if (read) {
    return (
      <CheckCheck 
        className={cn("h-3.5 w-3.5 text-blue-500", className)} 
      />
    );
  }

  // Double gray check for delivered
  if (delivered) {
    return (
      <CheckCheck 
        className={cn("h-3.5 w-3.5 text-muted-foreground/70", className)} 
      />
    );
  }

  // Single gray check for sent
  return (
    <Check 
      className={cn("h-3.5 w-3.5 text-muted-foreground/70", className)} 
    />
  );
}
