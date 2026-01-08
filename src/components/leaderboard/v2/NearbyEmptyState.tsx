/**
 * NearbyEmptyState - Empty state when user has no home club set
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NearbyEmptyStateProps {
  variant: 'no-home-club' | 'no-nearby-players';
}

export function NearbyEmptyState({ variant }: NearbyEmptyStateProps) {
  const navigate = useNavigate();

  if (variant === 'no-home-club') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center mb-4">
          <MapPin className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          Set your home club
        </h3>
        <p className="text-sm text-muted-foreground max-w-[260px] mb-5">
          Add your home club to see golfers playing Top 100s near you.
        </p>
        <Button
          onClick={() => navigate('/settings/profile')}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Home Club
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center mb-4">
        <MapPin className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1.5">
        No nearby rivals yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-[260px] mb-5">
        Be the first to explore Top 100 courses in your area!
      </p>
      <Button
        onClick={() => navigate('/courses?tab=top100')}
        variant="outline"
        size="sm"
      >
        Browse Top 100s
      </Button>
    </div>
  );
}
