import React from 'react';

interface EmptyNearbyStateProps {
  variant?: 'default' | 'hidden';
}

export function EmptyNearbyState({ variant = 'default' }: EmptyNearbyStateProps) {
  const title = variant === 'hidden' 
    ? "You're currently hidden"
    : "No golfers in range";

  const body = variant === 'hidden'
    ? "Switch to Everyone or Friends to show up for nearby golfers."
    : "Try increasing your distance or checking back a little later.";

  return (
    <div className="flex flex-col items-center text-center mt-16 px-4">
              <h2 className="text-body-lg font-semibold leading-snug text-[color:var(--hub-text)] mb-1">
                {title}
              </h2>

              <p className="text-body-md font-normal leading-relaxed text-[color:var(--hub-text-muted)] max-w-xs">
                {body}
              </p>
    </div>
  );
}
