/**
 * Export Progress HUD
 * Shows progress during bulk export with cancel option
 */
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportHudProps {
  current: number;
  total: number;
  bytes: number;
  onCancel: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ExportHud({ current, total, bytes, onCancel }: ExportHudProps) {
  const percent = Math.round((current / total) * 100);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 glass-panel p-4 min-w-[320px] animate-slideUp"
      role="status"
      aria-live="polite"
      aria-label={`Exporting ${current} of ${total} conversations`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground mb-1">
            Exporting {total} conversation{total !== 1 ? 's' : ''}…
          </div>
          <div className="text-xs text-muted-foreground">
            {current}/{total} • {formatBytes(bytes)}
          </div>
        </div>
        <button
          onClick={onCancel}
          className={cn(
            "p-1.5 rounded-lg",
            "hover:bg-white/10 active:bg-white/5",
            "transition-colors"
          )}
          aria-label="Cancel export"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
