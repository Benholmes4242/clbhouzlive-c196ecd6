import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

interface EmptyFriendsStateProps {
  title: string;
}

export function EmptyFriendsState({ title }: EmptyFriendsStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Icon in circular background */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Title (varies by screen) */}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      {/* Subtext – SAME on all screens */}
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Find other golfers to see where they've been playing and discover new courses.
      </p>

      {/* Button – SAME on all screens */}
      <Button
        variant="secondary"
        onClick={() => navigate('/golferstofollow')}
        className="w-full max-w-[320px]"
      >
        Find golfers to follow
      </Button>
    </div>
  );
}

export default EmptyFriendsState;
