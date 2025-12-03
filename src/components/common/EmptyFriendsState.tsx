import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

interface EmptyFriendsStateProps {
  title: string;
}

export function EmptyFriendsState({ title }: EmptyFriendsStateProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/golferstofollow');
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Icon */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Title (varies by screen) */}
      <p className="mb-2 text-base font-semibold text-foreground">
        {title}
      </p>

      {/* Subtext – SAME on both screens */}
      <p className="mb-6 max-w-xs text-sm text-muted-foreground">
        Follow other golfers to see where they've been playing and discover new courses.
      </p>

      {/* Button – squircle style */}
      <button
        type="button"
        onClick={handleClick}
        className="
          inline-flex items-center justify-center
          px-6 py-3
          text-sm font-semibold
          bg-foreground text-background
          shadow-sm
          rounded-2xl
          active:scale-[0.99]
          transition-transform
        "
      >
        Find golfers to follow
      </button>
    </div>
  );
}
