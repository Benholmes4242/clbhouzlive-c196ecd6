import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MetricTileProps {
  label: string;
  value: number | null;
  icon: LucideIcon;
  loading?: boolean;
  error?: boolean;
  subtitle?: string;
  tooltip?: string;
  onClick?: () => void;
}

export function MetricTile({
  label,
  value,
  icon: Icon,
  loading = false,
  error = false,
  subtitle,
  tooltip,
  onClick,
}: MetricTileProps) {
  if (loading) {
    return (
      <div className="flex-shrink-0 snap-start w-[140px] sm:w-auto">
        <div className="rounded-lg border bg-card p-3 sm:p-4 h-full">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-7 w-12 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-shrink-0 snap-start w-[140px] sm:w-auto">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:p-4 h-full">
          <span className="text-xs text-destructive">Failed to load</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 snap-start w-[140px] sm:w-auto">
      <div 
        className={cn(
          "rounded-lg border bg-card p-3 sm:p-4 h-full transition-all",
          onClick && "cursor-pointer hover:bg-accent/50 hover:border-border/80"
        )}
        onClick={onClick}
        title={tooltip}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground truncate pr-2">{label}</span>
          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </div>
        <div className="text-xl sm:text-2xl font-semibold tabular-nums">
          {value !== null ? value.toLocaleString() : "—"}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
