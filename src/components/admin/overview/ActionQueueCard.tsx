import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface ActionQueueCardProps {
  title: string;
  count: number | null;
  description: string;
  ctaLabel: string;
  ctaPath: string;
  icon: LucideIcon;
  loading?: boolean;
  error?: boolean;
}

export function ActionQueueCard({
  title,
  count,
  description,
  ctaLabel,
  ctaPath,
  icon: Icon,
  loading = false,
  error = false,
}: ActionQueueCardProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">Failed to load queue</p>
      </div>
    );
  }

  const isEmpty = count === 0;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{title}</span>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={`text-lg font-semibold tabular-nums ${isEmpty ? 'text-muted-foreground' : 'text-foreground'}`}>
          {count !== null ? count : "—"}
        </div>
      </div>

      {isEmpty ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>All clear</span>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => navigate(ctaPath)}
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
