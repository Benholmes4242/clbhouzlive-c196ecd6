/**
 * LeadersEmptyState — Empty state when no rankings data exists.
 */

import { Trophy } from 'lucide-react';

export function LeadersEmptyState() {
  return (
    <div className="bg-muted/20 border border-border/30 rounded-2xl p-8 text-center">
      <Trophy className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
      <h3 className="text-[15px] font-semibold text-foreground">
        No Rankings Available
      </h3>
      <p className="text-[13px] text-muted-foreground/70 mt-1">
        Season statistics are being processed. Check back soon.
      </p>
    </div>
  );
}
