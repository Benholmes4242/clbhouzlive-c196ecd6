import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEditProfileRoute } from '@/hooks/useEditProfileRoute';

interface HandicapSummaryCardProps {
  handicapIndex: number | null;
  lastUpdatedAt: string | null;
  isOwnProfile: boolean;
}

const HandicapSummaryCard: React.FC<HandicapSummaryCardProps> = ({
  handicapIndex,
  lastUpdatedAt,
  isOwnProfile,
}) => {
  const navigate = useNavigate();

  const formatHandicap = (hcp: number): string => {
    if (hcp < 0) return `+${Math.abs(hcp).toFixed(1)}`;
    return hcp.toFixed(1);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Empty state for own profile
  if (handicapIndex === null && isOwnProfile) {
    return (
      <div className="bg-card border border-border rounded-sq-lg p-6 text-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-semibold text-muted-foreground">?</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No handicap set</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add your handicap index to show it on your profile
        </p>
        <Button
          onClick={() => navigate('/quick-edit-profile?tab=basic')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add handicap
        </Button>
      </div>
    );
  }

  // Empty state for other profiles
  if (handicapIndex === null) {
    return (
      <div className="bg-card border border-border rounded-sq-lg p-6 text-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-semibold text-muted-foreground">–</span>
        </div>
        <p className="text-sm text-muted-foreground">
          This golfer hasn't added their handicap yet
        </p>
      </div>
    );
  }

  // Has handicap
  return (
    <div className="bg-card border border-border rounded-sq-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
            Handicap Index
          </p>
          <p className="text-4xl font-bold text-foreground">
            {formatHandicap(handicapIndex)}
          </p>
          {lastUpdatedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Last edited {formatDate(lastUpdatedAt)}{isOwnProfile ? ' · Added by you' : ''}
            </p>
          )}
        </div>
        {isOwnProfile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/quick-edit-profile?tab=basic')}
            className="text-muted-foreground"
          >
            Edit handicap
          </Button>
        )}
      </div>
    </div>
  );
};

export default HandicapSummaryCard;
