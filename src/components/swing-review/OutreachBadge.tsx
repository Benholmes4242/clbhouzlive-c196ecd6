import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar } from 'lucide-react';

interface OutreachBadgeProps {
  coachCount: number;
  createdAt: string;
  onClick?: () => void;
}

export const OutreachBadge: React.FC<OutreachBadgeProps> = ({
  coachCount,
  createdAt,
  onClick
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg ${
        onClick ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''
      }`}
      onClick={onClick}
    >
      <Users className="h-4 w-4 text-blue-600" />
      <span className="text-sm text-blue-800 font-medium">
        Coach outreach sent to {coachCount} coach{coachCount > 1 ? 'es' : ''}
      </span>
      <div className="flex items-center gap-1 text-xs text-blue-600">
        <Calendar className="h-3 w-3" />
        {formatDate(createdAt)}
      </div>
      {onClick && (
        <span className="text-xs text-blue-600 underline">View</span>
      )}
    </div>
  );
};