/**
 * PlayersEmptyState - Simple empty state for search/filter with no results.
 */

import { Search } from 'lucide-react';

interface PlayersEmptyStateProps {
  message?: string;
  description?: string;
}

export function PlayersEmptyState({
  message = 'No Players Found',
  description = 'Try adjusting your search or filter.',
}: PlayersEmptyStateProps) {
  return (
    <div className="bg-muted/30 border border-border/50 rounded-2xl p-8 text-center">
      <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-foreground">{message}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
