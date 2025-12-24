import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BulkProgress } from '@/hooks/useBulkSelect';

interface BulkActionBarProps {
  selectedCount: number;
  onCancel: () => void;
  processing: boolean;
  progress: BulkProgress | null;
  actions: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline';
    icon?: React.ReactNode;
    disabled?: boolean;
  }[];
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  onCancel,
  processing,
  progress,
  actions,
  className,
}: BulkActionBarProps) {
  const progressPercent = progress ? (progress.processed / progress.total) * 100 : 0;
  const isComplete = progress && progress.processed === progress.total;

  if (selectedCount === 0 && !progress) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg p-4 md:static md:rounded-lg md:border md:shadow-none md:mb-4",
        className
      )}
    >
      <div className="flex flex-col gap-3 max-w-screen-xl mx-auto">
        {/* Progress display */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isComplete ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Complete
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing {progress.processed} / {progress.total}
                  </span>
                )}
              </span>
              {isComplete && (
                <span className="text-sm">
                  <span className="text-emerald-600">{progress.succeeded} succeeded</span>
                  {progress.failed > 0 && (
                    <span className="text-red-600 ml-2">{progress.failed} failed</span>
                  )}
                </span>
              )}
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Actions row */}
        {!processing && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedCount} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant || 'default'}
                  onClick={action.onClick}
                  disabled={action.disabled || selectedCount === 0}
                  className="gap-1.5"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile-optimized sticky header for select mode
interface SelectModeHeaderProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onCancel: () => void;
}

export function SelectModeHeader({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onCancel,
}: SelectModeHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          {selectedCount} of {totalCount} selected
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={onToggleAll}>
        {allSelected ? 'Deselect all' : 'Select all'}
      </Button>
    </div>
  );
}
