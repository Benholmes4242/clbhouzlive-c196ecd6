import React from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusVariant = "success" | "warning" | "error" | "default" | "muted";

interface AdminListCardProps {
  primary: string;
  secondary?: string;
  metadata?: Array<{ label: string; value: string }>;
  status?: {
    label: string;
    variant: StatusVariant;
  };
  onClick?: () => void;
  className?: string;
}

const statusVariantClasses: Record<StatusVariant, string> = {
  success: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  default: "bg-primary/10 text-primary border-primary/20",
  muted: "bg-muted text-muted-foreground border-border",
};

export function AdminListCard({
  primary,
  secondary,
  metadata,
  status,
  onClick,
  className,
}: AdminListCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-colors active:bg-accent/50",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Primary line */}
          <div className="font-medium text-sm truncate">{primary}</div>
          
          {/* Secondary line */}
          {secondary && (
            <div className="text-xs text-muted-foreground truncate">{secondary}</div>
          )}
          
          {/* Metadata grid */}
          {metadata && metadata.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {metadata.map((item, idx) => (
                <span key={idx}>
                  <span className="opacity-60">{item.label}:</span> {item.value}
                </span>
              ))}
            </div>
          )}
          
          {/* Status pill */}
          {status && (
            <Badge
              variant="outline"
              className={cn("text-xs font-normal", statusVariantClasses[status.variant])}
            >
              {status.label}
            </Badge>
          )}
        </div>

        {/* Right: Chevron */}
        {onClick && (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </div>
    </div>
  );
}
