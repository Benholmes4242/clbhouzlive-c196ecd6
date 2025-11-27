import React from 'react';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface FriendsSnapshotCardProps {
  timeframe: string;
  totalCourses: number;
  totalRegions: number;
  averageRating: number | null;
  totalRounds: number;
}

const FriendsSnapshotCard: React.FC<FriendsSnapshotCardProps> = ({
  timeframe,
  totalCourses,
  totalRegions,
  averageRating,
  totalRounds,
}) => {
  const getTimeLabel = () => {
    switch (timeframe) {
      case '7d': return '7 days';
      case '30d': return '30 days';
      case '90d': return '90 days';
      case '12m': return '12 months';
      case 'all': return 'all time';
      default: return timeframe;
    }
  };

  const getSubtitle = () => {
    if (timeframe === 'all') {
      return 'Your friends have played…';
    }
    return `In the last ${getTimeLabel()} your friends played…`;
  };

  return (
    <Card className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Friends' Courses</h3>
            <p className="text-sm text-muted-foreground">{getSubtitle()}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="text-foreground font-medium">{totalCourses}</span> different course{totalCourses !== 1 ? 's' : ''}
          </span>
          <span className="text-muted-foreground/50">•</span>
          <span className="flex items-center gap-1">
            in <span className="text-foreground font-medium">{totalRegions}</span> region{totalRegions !== 1 ? 's' : ''}
          </span>
          {averageRating && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="flex items-center gap-1">
                average rating <span className="text-foreground font-medium">{averageRating.toFixed(1)}/10</span>
              </span>
            </>
          )}
          <span className="text-muted-foreground/50">•</span>
          <span className="flex items-center gap-1">
            <span className="text-foreground font-medium">{totalRounds}</span> round{totalRounds !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default FriendsSnapshotCard;
