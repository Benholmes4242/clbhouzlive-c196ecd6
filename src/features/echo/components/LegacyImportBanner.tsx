import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type Props = {
  isMigrating: boolean;
  onAccept: () => void;
  onDismiss: () => void;
};

export function LegacyImportBanner({ isMigrating, onAccept, onDismiss }: Props) {
  return (
    <div
      className="mb-3 rounded-xl border bg-white/5 p-3 backdrop-blur"
      style={{ borderColor: 'var(--hub-stroke)' }}
      role="region"
      aria-label="Import older local conversations"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-white">
            Import older local conversations
          </div>
          <div className="text-xs text-white/70 mt-0.5">
            We found Echo chats saved on this device. Import them to your account so they're available across devices.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onDismiss}
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            Not now
          </Button>
          <Button
            onClick={onAccept}
            disabled={isMigrating}
            className="bg-white/15 border border-white/20 hover:bg-white/25"
          >
            {isMigrating ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Importing…
              </span>
            ) : (
              'Import'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
