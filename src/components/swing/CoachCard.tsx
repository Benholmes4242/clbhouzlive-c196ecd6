import React, { useState } from 'react';
import { MapPin, Clock, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { CoachProfile } from '@/types/coach';

interface CoachCardProps {
  coach: CoachProfile;
  onSelect: (coach: CoachProfile) => void;
  isSelected?: boolean;
}

export const CoachCard: React.FC<CoachCardProps> = ({
  coach,
  onSelect,
  isSelected = false
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect(coach)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{coach.name}</h3>
            {coach.distance && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {coach.distance.toFixed(1)} km away
              </div>
            )}
          </div>
          {coach.pricingNote && (
            <div className="text-sm font-medium text-primary">
              {coach.pricingNote}
            </div>
          )}
        </div>

        {coach.bio && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {coach.bio}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {coach.specialties.map((specialty) => (
            <Badge 
              key={specialty} 
              variant="secondary" 
              className="text-xs"
            >
              {specialty}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Typical response: ~24h</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-current text-yellow-400" />
            <span>PGA Pro</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          className={`w-full ${isSelected ? 'bg-primary' : ''}`}
          variant={isSelected ? 'default' : 'outline'}
        >
          {isSelected ? 'Selected' : 'Select Coach'}
        </Button>
      </CardFooter>
    </Card>
  );
};