import * as React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { HomeClubsPayload, ClubMini } from '@/hooks/useHomeClubsMap';

interface PeopleCardClubsProps {
  payload?: HomeClubsPayload | null;
  className?: string;
}

/**
 * Renders home club info on People cards.
 * 
 * Rules:
 * - If primary is null → show no club info at all (including additional)
 * - If primary exists → show it
 * - If primary exists AND additional_count > 0 → show "Also plays at … +N"
 */
export function PeopleCardClubs({ payload, className }: PeopleCardClubsProps) {
  const primary = payload?.primary ?? null;
  const additionalCount = payload?.additional_count ?? 0;
  const preview = payload?.additional_preview ?? [];

  // Ship rule: only show additional if primary is visible
  const showAdditional = !!primary && additionalCount > 0;

  if (!primary) return null;

  const first = preview[0]?.name;
  const remaining = Math.max(0, additionalCount - 1);

  const alsoPlaysText =
    additionalCount === 1 && first
      ? `Also plays at ${first}`
      : first
      ? `Also plays at ${first} +${remaining}`
      : `Also plays at +${additionalCount}`;

  return (
    <div className={cn('mt-2 space-y-1', className)}>
      {/* Primary */}
      <div className="flex items-center gap-1.5 text-xs font-medium truncate">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="truncate">{primary.name}</span>
      </div>

      {/* Additional (optional) */}
      {showAdditional && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-center justify-between gap-2 text-left text-[11px] text-muted-foreground hover:text-foreground transition"
            >
              <span className="truncate">{alsoPlaysText}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-90 transition flex-shrink-0" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-[260px] rounded-sq-md p-3"
          >
            <div className="text-xs font-semibold">Also plays at</div>

            <div className="mt-2 space-y-1">
              {preview.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  {additionalCount} club{additionalCount === 1 ? '' : 's'}
                </div>
              ) : (
                preview.map((c) => (
                  <div
                    key={c.id}
                    className="text-xs rounded-sq-sm px-2 py-1.5 bg-muted/30"
                  >
                    {c.name}
                  </div>
                ))
              )}
            </div>

            {additionalCount > preview.length && (
              <div className="mt-2 text-[11px] text-muted-foreground">
                +{additionalCount - preview.length} more
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
