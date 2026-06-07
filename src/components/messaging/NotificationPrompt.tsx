import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AMBER, INK_MUTE, SURFACE } from './_shared/tokens';

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
      className={cn("flex items-center", className)}
      style={{
        borderRadius: 16,
        padding: '10px 14px',
        background: 'rgba(247,147,30,0.07)',
        border: '1px solid rgba(247,147,30,0.20)',
        gap: 12,
      }}
    >
      {/* Icon box */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(247,147,30,0.15)',
        }}
      >
        <Bell style={{ color: AMBER }} className="w-4 h-4" />
      </div>
      
      {/* Text column */}
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>
          Enable notifications
        </p>
        <p style={{ fontSize: 12, color: INK_MUTE, margin: 0 }}>
          Don't miss a message
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center flex-shrink-0" style={{ gap: 8 }}>
        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="flex items-center justify-center"
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(0,0,0,0.06)', border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Dismiss"
        >
          <X style={{ color: INK_MUTE }} className="w-3.5 h-3.5" />
        </button>

        {/* Enable — amber gradient with glow */}
        <button
          onClick={handleEnable}
          disabled={isEnabling}
          className="active:scale-[0.97] transition-transform"
          style={{
            padding: '6px 14px', borderRadius: 99,
            background: `linear-gradient(90deg, #F59E0B, ${AMBER})`,
            color: SURFACE,
            fontSize: 12, fontWeight: 800, letterSpacing: '-0.01em',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(247,147,30,0.32)',
          }}
        >
          {isEnabling ? 'Enabling…' : 'Enable'}
        </button>
      </div>
    </div>
  );
}
