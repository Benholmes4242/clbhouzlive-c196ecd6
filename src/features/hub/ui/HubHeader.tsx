import React from 'react';
import { Home } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export interface HubHeaderProps {
  firstName: string;
  onRightIconPress: () => void;
}

/**
 * HubHeader
 * - Big greeting text that autosizes (clamp) and wraps instead of truncating.
 * - Right icon: premium white circle button.
 */
export function HubHeader({ firstName, onRightIconPress }: HubHeaderProps) {
  const greeting = getGreeting();
  
  return (
    <div className="flex items-start justify-between gap-3">
      <h1
        className="hubGreeting"
        aria-label={`Greeting: ${greeting}, ${firstName}`}
      >
        {greeting}, {firstName}
      </h1>

      <button
        type="button"
        className="headerIconBtn"
        onClick={onRightIconPress}
        aria-label="Header action"
      >
        <Home className="h-5 w-5 text-black/80" />
      </button>
    </div>
  );
}
