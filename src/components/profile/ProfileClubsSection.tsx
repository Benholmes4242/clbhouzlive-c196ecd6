import * as React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserHomeClubs } from '@/hooks/useHomeClubsMap';
import { Button } from '@/components/ui/button';

interface ProfileClubsSectionProps {
  profileUserId: string;
  viewerId: string;
  className?: string;
  onOpenFullClubs?: () => void;
}

/**
 * Profile page Clubs section that respects visibility settings.
 * Calls get_home_clubs_for_user RPC to get viewer-aware club data.
 */
export function ProfileClubsSection({
  profileUserId,
  viewerId,
  className,
  onOpenFullClubs,
}: ProfileClubsSectionProps) {
  const { clubs, loading } = useUserHomeClubs(profileUserId, viewerId);

  if (loading) {
    return (
      <div className={cn('rounded-sq-md border border-border bg-card p-4', className)}>
        <div className="text-sm font-semibold">Clubs</div>
        <div className="mt-2 text-xs text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const primary = clubs?.primary ?? null;
  const additionalCount = clubs?.additional_count ?? 0;
  const preview = clubs?.additional_preview ?? [];

  // If visibility blocks primary, RPC returns null. Keep UI clean.
  const nothingVisible = !primary;

  return (
    <div className={cn('rounded-sq-md border border-border bg-card p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Clubs</div>

        {/* Optional CTA – only show if there's more to explore */}
        {primary && additionalCount > preview.length && onOpenFullClubs && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onOpenFullClubs}
          >
            See all <ChevronRight className="ml-1 h-3.5 w-3.5 opacity-70" />
          </Button>
        )}
      </div>

      {nothingVisible ? (
        <div className="mt-2 text-xs text-muted-foreground">
          No clubs to show.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {/* Primary */}
          <div>
            <div className="text-[11px] text-muted-foreground">Home club</div>
            <div className="mt-1 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium truncate">{primary.name}</div>
            </div>
          </div>

          {/* Additional */}
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-muted-foreground">Also plays at</div>
              {additionalCount > 0 && (
                <div className="text-[11px] text-muted-foreground">
                  {additionalCount}
                </div>
              )}
            </div>

            {additionalCount === 0 ? (
              <div className="mt-1 text-xs text-muted-foreground">
                No additional clubs added.
              </div>
            ) : (
              <>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preview.map((c) => (
                    <span
                      key={c.id}
                      className="text-xs rounded-full border border-border bg-muted/25 px-3 py-1"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>

                {additionalCount > preview.length && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    +{additionalCount - preview.length} more
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
