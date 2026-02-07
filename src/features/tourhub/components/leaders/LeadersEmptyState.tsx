/**
 * LeadersEmptyState — Empty state when no rankings data exists.
 */

import { Trophy } from 'lucide-react';

export function LeadersEmptyState() {
  return (
    <div className="bg-muted/30 border border-border/50 rounded-2xl p-8 text-center">
      <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-foreground">
        No Rankings Available
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        Season statistics are being processed. Check back soon.
      </p>
    </div>
  );
}
