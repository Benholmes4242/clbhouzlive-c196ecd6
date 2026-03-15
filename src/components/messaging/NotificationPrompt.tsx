import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationPromptProps {
  onEnable: () => Promise<boolean>;
  onDismiss: () => void;
  className?: string;
}

export function NotificationPrompt({ 
  onEnable, 
  onDismiss,
  className 
}: NotificationPromptProps) {
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const granted = await onEnable();
      if (granted) {
        onDismiss();
      }
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-[hsl(38,92%,50%)]/10 border-b border-[hsl(38,92%,50%)]/20",
        className
      )}
    >
      <div className="flex-shrink-0">
        <Bell className="h-5 w-5 text-[hsl(38,92%,50%)]" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          Enable notifications to get alerted when you receive messages
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          Maybe Later
        </Button>
        <Button
          size="sm"
          onClick={handleEnable}
          disabled={isEnabling}
          className="bg-[hsl(38,92%,50%)] hover:bg-[hsl(36,84%,46%)] text-white border-0"
        >
          {isEnabling ? 'Enabling...' : 'Enable'}
        </Button>
      </div>

      <button
        onClick={onDismiss}
        className="p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Dismiss notification prompt"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
