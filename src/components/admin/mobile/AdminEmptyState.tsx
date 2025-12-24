import { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function AdminEmptyState({
  icon: Icon = Inbox,
  title,
  description,
}: AdminEmptyStateProps) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center space-y-3">
      <div className="flex justify-center">
        <div className="rounded-full bg-muted p-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
      <div className="text-sm font-medium">{title}</div>
      {description && (
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">{description}</p>
      )}
    </div>
  );
}
